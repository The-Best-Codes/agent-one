import { useEffect } from "react";

import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { keyringStorage } from "@/lib/storage/keyring-storage";
import { clearAuthToken, setAuthToken } from "@/lib/sync/synced-storage";

const TOKEN_KEY = "agent-one-web-auth-token";

export function SettingsSyncManager() {
  const { user, isLoading } = useWebAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      void keyringStorage
        .getItem<string | null>(TOKEN_KEY, null)
        .then((token) => {
          if (token) {
            setAuthToken(token);
          }
        });
    } else {
      clearAuthToken();
    }

    return () => {
      clearAuthToken();
    };
  }, [user, isLoading]);

  return null;
}
