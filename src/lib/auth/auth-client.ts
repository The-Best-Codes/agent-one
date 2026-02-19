import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const SERVER_URL = "https://www.agent-one.dev";
const CLIENT_ID = "agent-one-desktop";

let cachedToken: string | null = null;

export function setAuthToken(token: string | null): void {
  cachedToken = token;
}

export function getAuthToken(): string | null {
  return cachedToken;
}

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  fetchOptions: {
    customFetchImpl: tauriFetch,
    auth: {
      type: "Bearer",
      token: () => cachedToken ?? "",
    },
  },
  plugins: [deviceAuthorizationClient()],
});

export { CLIENT_ID, SERVER_URL };
