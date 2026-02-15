import { openUrl } from "@tauri-apps/plugin-opener";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authClient, CLIENT_ID } from "@/lib/auth/auth-client";
import { getLogger } from "@/lib/logger";
import { keyringStorage } from "@/lib/storage/keyring-storage";

import {
  type DeviceFlowState,
  WebAuthContext,
  type WebAuthUser,
} from "./web-auth-contexts";

const logger = getLogger(import.meta.url);

const TOKEN_KEY = "agent-one-web-auth-token";
const DEVICE_GRANT_TYPE =
  "urn:ietf:params:oauth:grant-type:device_code" as const;

export const WebAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<WebAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const fetchSession = useCallback(async (accessToken: string) => {
    try {
      const { data } = await authClient.getSession({
        fetchOptions: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      });
      if (data?.user) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
        });
        return true;
      }
    } catch (error) {
      logger.warn("Failed to fetch session:", error);
    }
    return false;
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await keyringStorage.getItem<string | null>(
          TOKEN_KEY,
          null,
        );
        if (token) {
          const valid = await fetchSession(token);
          if (!valid) {
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
      await keyringStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setDeviceFlow(null);
      setIsSigningIn(false);
    } finally {
      setIsSigningOut(false);
    }
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSigningIn,
      isSigningOut,
      deviceFlow,
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
      startSignIn,
      cancelSignIn,
      signOut,
    ],
  );

  return (
    <WebAuthContext.Provider value={value}>{children}</WebAuthContext.Provider>
  );
};
