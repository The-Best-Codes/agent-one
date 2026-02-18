import { useEffect } from "react";

import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { TOKEN_KEY } from "@/lib/auth/auth-client";
import { keyringStorage } from "@/lib/storage/keyring-storage";
import { clearSyncToken, setSyncToken } from "@/lib/sync/synced-storage";

export function SettingsSyncManager() {
  const { user, isLoading } = useWebAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      void keyringStorage
        .getItem<string | null>(TOKEN_KEY, null)
        .then((token) => {
          if (token) {
            setSyncToken(token);
          }
        });
    } else {
      clearSyncToken();
    }

    return () => {
      clearSyncToken();
    };
  }, [user, isLoading]);

  return null;
}
