import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// The Tauri HTTP plugin attaches the webview origin unless Origin is set to "",
// which many provider APIs (Anthropic, Ollama, LM Studio, ...) reject.
export const providerFetch: typeof tauriFetch = (input, init) => {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );

  if (!headers.has("Origin")) {
    headers.set("Origin", "");
  }

  return tauriFetch(input, { ...init, headers });
};
