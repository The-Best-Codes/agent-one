import { polarClient } from "@polar-sh/better-auth/client";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { platform } from "@tauri-apps/plugin-os";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import packageJson from "@/../package.json";

const SERVER_URL = "https://www.agent-one.dev";
const CLIENT_ID = "agent-one-desktop";

function buildUserAgent(): string {
  let label = "Unknown";
  try {
    label = platform() ?? "Unknown";
  } catch {
    // no-op
  }
  return `AgentOne/${packageJson.version} (${label})`;
}

const USER_AGENT = buildUserAgent();

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
    headers: {
      Origin: SERVER_URL,
      "User-Agent": USER_AGENT,
    },
    auth: {
      type: "Bearer",
      token: () => cachedToken ?? "",
    },
  },
  plugins: [deviceAuthorizationClient(), polarClient()],
});

export { CLIENT_ID, SERVER_URL };
