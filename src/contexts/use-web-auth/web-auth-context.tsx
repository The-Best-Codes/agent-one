import { openUrl } from "@tauri-apps/plugin-opener";
import { useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { authClient, CLIENT_ID, setAuthToken } from "@/lib/auth/auth-client";
import { getApiKeyBaseAtom } from "@/lib/jotai/api-key-atoms";
import { getProviderConfigAtom } from "@/lib/jotai/provider-atoms";
import { getLogger } from "@/lib/logger";
import { keyringStorage } from "@/lib/storage/keyring-storage";
import { settingsSyncManager } from "@/lib/sync/settings-sync-manager";

import {
  type CustomerState,
  type DeviceFlowState,
  WebAuthContext,
  type WebAuthUser,
} from "./web-auth-contexts";

const logger = getLogger(import.meta.url);

const TOKEN_KEY = "agent-one-web-auth-token";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code" as const;

export const WebAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const setAgentOneApiKey = useSetAtom(getApiKeyBaseAtom("agent-one"));
  const setAgentOneConfig = useSetAtom(getProviderConfigAtom("agent-one"));

  const [user, setUser] = useState<WebAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState | null>(null);
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const fetchSession = useCallback(
    async (accessToken: string): Promise<"valid" | "invalid" | "error"> => {
      try {
        setAuthToken(accessToken);
        const { data, error } = await authClient.getSession({
          fetchOptions: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        });
        if (data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          });
          void setAgentOneApiKey(accessToken);
          setAgentOneConfig({ enabled: true, headers: {}, models: [] });
          void settingsSyncManager.pull();
          return "valid";
        }
        if (error?.status === 401 || error?.status === 403) {
          setAuthToken(null);
          void setAgentOneApiKey("");
          setAgentOneConfig({ enabled: false, headers: {}, models: [] });
          return "invalid";
        }
        if (error) {
          logger.warn("Session fetch returned error:", error);
          return "error";
        }
        setAuthToken(null);
        return "invalid";
      } catch (error) {
        logger.warn("Failed to fetch session:", error);
        return "error";
      }
    },
    [setAgentOneApiKey, setAgentOneConfig],
  );

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await keyringStorage.getItem<string | null>(TOKEN_KEY, null);
        if (token) {
          const result = await fetchSession(token);
          if (result === "invalid") {
            await keyringStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (error) {
        logger.warn("Failed to restore auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void restoreSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerState(null);
      setBillingError(null);
      setBillingLoading(false);
      return;
    }

    let cancelled = false;

    const loadBilling = async (silent = false) => {
      if (!silent && !customerState) {
        setBillingLoading(true);
      }
      setBillingError(null);

      try {
        const { data, error } = await authClient.customer.state();
        if (cancelled) return;

        if (error) {
          setBillingError("Unable to load billing information.");
          return;
        }

        setCustomerState((data as CustomerState | null) ?? null);
      } catch {
        if (!cancelled) {
          setBillingError("Unable to load billing information.");
        }
      } finally {
        if (!cancelled && (!silent || !customerState)) {
          setBillingLoading(false);
        }
      }
    };

    void loadBilling();

    const id = setInterval(() => {
      void loadBilling(true);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollForToken = useCallback(
    (deviceCode: string, interval: number, expiresAt: number) => {
      let currentInterval = interval;

      const poll = async () => {
        if (cancelledRef.current || Date.now() >= expiresAt) {
          setIsSigningIn(false);
          setDeviceFlow(null);
          return;
        }

        try {
          const { data, error } = await authClient.device.token({
            grant_type: DEVICE_GRANT_TYPE,
            device_code: deviceCode,
            client_id: CLIENT_ID,
          });

          if (data?.access_token) {
            await keyringStorage.setItem(TOKEN_KEY, data.access_token);
            await fetchSession(data.access_token);
            setIsSigningIn(false);
            setDeviceFlow(null);
            return;
          }

          if (error) {
            switch (error.error) {
              case "authorization_pending":
                break;
              case "slow_down":
                currentInterval += 5;
                break;
              case "access_denied":
                logger.warn("Device authorization denied by user");
                setIsSigningIn(false);
                setDeviceFlow(null);
                return;
              case "expired_token":
                logger.warn("Device code expired");
                setIsSigningIn(false);
                setDeviceFlow(null);
                return;
              default:
                logger.error("Device token error:", error);
                setIsSigningIn(false);
                setDeviceFlow(null);
                return;
            }
          }
        } catch (error) {
          logger.error("Device token poll error:", error);
          setIsSigningIn(false);
          setDeviceFlow(null);
          return;
        }

        pollingRef.current = setTimeout(poll, currentInterval * 1000);
      };

      pollingRef.current = setTimeout(poll, currentInterval * 1000);
    },
    [fetchSession],
  );

  const startSignIn = useCallback(async () => {
    cancelledRef.current = false;
    setIsSigningIn(true);
    stopPolling();

    try {
      const { data, error } = await authClient.device.code({
        client_id: CLIENT_ID,
      });

      if (error || !data) {
        logger.error("Failed to request device code:", error);
        setIsSigningIn(false);
        return;
      }

      const interval = data.interval ?? 5;
      const expiresAt = Date.now() + (data.expires_in ?? 1800) * 1000;

      setDeviceFlow({
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        verificationUriComplete: data.verification_uri_complete,
        deviceCode: data.device_code,
        expiresAt,
        interval,
      });

      const url = data.verification_uri_complete || data.verification_uri;
      await openUrl(url);

      pollForToken(data.device_code, interval, expiresAt);
    } catch (error) {
      logger.error("Failed to start device sign-in:", error);
      setIsSigningIn(false);
    }
  }, [stopPolling, pollForToken]);

  const cancelSignIn = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setIsSigningIn(false);
    setDeviceFlow(null);
  }, [stopPolling]);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      stopPolling();
      setAuthToken(null);
      await keyringStorage.removeItem(TOKEN_KEY);
      void setAgentOneApiKey("");
      setAgentOneConfig({ enabled: false, headers: {}, models: [] });
      setUser(null);
      setDeviceFlow(null);
      setIsSigningIn(false);
    } finally {
      setIsSigningOut(false);
    }
  }, [stopPolling, setAgentOneApiKey, setAgentOneConfig]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!user) return;

    const id = setInterval(() => {
      void settingsSyncManager.pull();
    }, 60_000);

    return () => clearInterval(id);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSigningIn,
      isSigningOut,
      deviceFlow,
      customerState,
      billingLoading,
      billingError,
      startSignIn,
      cancelSignIn,
      signOut,
    }),
    [
      user,
      isLoading,
      isSigningIn,
      isSigningOut,
      deviceFlow,
      customerState,
      billingLoading,
      billingError,
      startSignIn,
      cancelSignIn,
      signOut,
    ],
  );

  return <WebAuthContext.Provider value={value}>{children}</WebAuthContext.Provider>;
};
