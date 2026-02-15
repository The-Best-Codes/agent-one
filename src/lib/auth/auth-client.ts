import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const SERVER_URL = "https://www.agent-one.dev";
const CLIENT_ID = "agent-one-desktop";

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  fetchOptions: {
    customFetchImpl: tauriFetch,
  },
  plugins: [deviceAuthorizationClient()],
});

export { CLIENT_ID, SERVER_URL };
