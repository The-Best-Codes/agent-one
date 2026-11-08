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

type SignInState =
  | { phase: "idle" }
  | { phase: "requesting-code"; attempt: number }
  | { phase: "awaiting-approval"; attempt: number; deviceFlow: DeviceFlowState };

export const WebAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const setAgentOneApiKey = useSetAtom(getApiKeyBaseAtom("agent-one"));
  const setAgentOneConfig = useSetAtom(getProviderConfigAtom("agent-one"));

  const [user, setUser] = useState<WebAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signInState, setSignInState] = useState<SignInState>({ phase: "idle" });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signInAttemptRef = useRef(0);
  const sessionGenerationRef = useRef(0);
  const loadBillingRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  const fetchSession = useCallback(
    async (accessToken: string): Promise<"valid" | "invalid" | "error"> => {
      const generation = sessionGenerationRef.current;
      try {
        setAuthToken(accessToken);
        const { data, error } = await authClient.getSession();
        if (generation !== sessionGenerationRef.current) {
          return "error";
        }
        if (data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          });
          void setAgentOneApiKey(accessToken);
          setAgentOneConfig({ enabled: true, headers: {}, models: [] });
          settingsSyncManager.syncNow();
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
          logger.error("Failed to load billing information", error);
          setBillingError("Unable to load billing information.");
          return;
        }

        if (!data) {
          setBillingError("Unable to load billing information.");
          return;
        }

        setCustomerState(data);
      } catch (error) {
        logger.error("Failed to load billing information", error);
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
    loadBillingRef.current = loadBilling;

    const id = setInterval(
      () => {
        void loadBilling(true);
      },
      60 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      loadBillingRef.current = null;
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

  const endSignInAttempt = useCallback((attempt: number) => {
    setSignInState((current) =>
      current.phase !== "idle" && current.attempt === attempt ? { phase: "idle" } : current,
    );
  }, []);

  const pollForToken = useCallback(
    (deviceCode: string, interval: number, expiresAt: number, attempt: number) => {
      let currentInterval = interval;
      const isCurrentAttempt = () => signInAttemptRef.current === attempt;

      const poll = async () => {
        if (!isCurrentAttempt()) return;
        if (Date.now() >= expiresAt) {
          endSignInAttempt(attempt);
          return;
        }

        try {
          const { data, error } = await authClient.device.token({
            grant_type: DEVICE_GRANT_TYPE,
            device_code: deviceCode,
            client_id: CLIENT_ID,
          });
          if (!isCurrentAttempt()) return;

          if (data?.access_token) {
            await keyringStorage.setItem(TOKEN_KEY, data.access_token);
            if (!isCurrentAttempt()) {
              await keyringStorage.removeItem(TOKEN_KEY);
              return;
            }
            await fetchSession(data.access_token);
            endSignInAttempt(attempt);
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
                endSignInAttempt(attempt);
                return;
              case "expired_token":
                logger.warn("Device code expired");
                endSignInAttempt(attempt);
                return;
              default:
                logger.error("Device token error:", error);
                endSignInAttempt(attempt);
                return;
            }
          }
        } catch (error) {
          logger.error("Device token poll error:", error);
          endSignInAttempt(attempt);
          return;
        }

        pollingRef.current = setTimeout(poll, currentInterval * 1000);
      };

      pollingRef.current = setTimeout(poll, currentInterval * 1000);
    },
    [fetchSession, endSignInAttempt],
  );

  const startSignIn = useCallback(async () => {
    const attempt = ++signInAttemptRef.current;
    stopPolling();
    setSignInState({ phase: "requesting-code", attempt });

    try {
      const { data, error } = await authClient.device.code({
        client_id: CLIENT_ID,
      });
      if (signInAttemptRef.current !== attempt) return;

      if (error || !data) {
        logger.error("Failed to request device code:", error);
        endSignInAttempt(attempt);
        return;
      }

      const interval = data.interval ?? 5;
      const expiresAt = Date.now() + (data.expires_in ?? 1800) * 1000;

      setSignInState({
        phase: "awaiting-approval",
        attempt,
        deviceFlow: {
          userCode: data.user_code,
          verificationUri: data.verification_uri,
          verificationUriComplete: data.verification_uri_complete,
          deviceCode: data.device_code,
          expiresAt,
          interval,
        },
      });

      pollForToken(data.device_code, interval, expiresAt, attempt);

      const url = data.verification_uri_complete || data.verification_uri;
      await openUrl(url).catch((error: unknown) => {
        logger.warn("Failed to open the sign-in page:", error);
      });
    } catch (error) {
      logger.error("Failed to start device sign-in:", error);
      endSignInAttempt(attempt);
    }
  }, [stopPolling, pollForToken, endSignInAttempt]);

  const cancelSignIn = useCallback(() => {
    signInAttemptRef.current++;
    stopPolling();
    setSignInState({ phase: "idle" });
  }, [stopPolling]);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      signInAttemptRef.current++;
      sessionGenerationRef.current++;
      stopPolling();
      settingsSyncManager.onSignedOut();
      setAuthToken(null);
      setUser(null);
      setSignInState({ phase: "idle" });
      void setAgentOneApiKey("");
      setAgentOneConfig({ enabled: false, headers: {}, models: [] });
      await keyringStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsSigningOut(false);
    }
  }, [stopPolling, setAgentOneApiKey, setAgentOneConfig]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!user) return;

    const id = setInterval(
      () => {
        settingsSyncManager.syncNow();
      },
      60 * 60 * 1000,
    );

    return () => clearInterval(id);
  }, [user]);

  const refreshBilling = useCallback(() => {
    void loadBillingRef.current?.(true);
  }, []);

  const isSigningIn = signInState.phase !== "idle";
  const deviceFlow = signInState.phase === "awaiting-approval" ? signInState.deviceFlow : null;

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
      refreshBilling,
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
      refreshBilling,
      startSignIn,
      cancelSignIn,
      signOut,
    ],
  );

  return <WebAuthContext.Provider value={value}>{children}</WebAuthContext.Provider>;
};
