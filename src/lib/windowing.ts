import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const CHANNEL_NAME = "agent-one-window-sync";
const STARTUP_PATH_PARAM = "p";

type WindowMessage =
  | { type: "metadata-sync" }
  | { type: "presence-query"; chatId: string }
  | { type: "presence-response"; chatId: string };

let sharedChannel: BroadcastChannel | null = null;
const listeners = new Set<(msg: WindowMessage) => void>();

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sharedChannel) {
    sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    sharedChannel.addEventListener("message", (event: MessageEvent<WindowMessage>) => {
      for (const listener of listeners) listener(event.data);
    });
  }
  return sharedChannel;
}

function broadcast(msg: WindowMessage): void {
  getChannel()?.postMessage(msg);
}

function subscribe(listener: (msg: WindowMessage) => void): () => void {
  getChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function openNewWindow(path = "/chat"): Promise<void> {
  const label = `a1-instance-${crypto.randomUUID().slice(0, 8)}`;
  const win = new WebviewWindow(label, {
    url: `index.html?${STARTUP_PATH_PARAM}=${encodeURIComponent(path)}`,
    title: "AgentOne",
    width: 1000,
    height: 700,
  });
  await new Promise<void>((resolve, reject) => {
    void win.once("tauri://created", () => resolve());
    void win.once("tauri://error", (event) => reject(event.payload));
  });
}

export function applyStartupPath(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const target = url.searchParams.get(STARTUP_PATH_PARAM);
  if (!target) return;
  url.searchParams.delete(STARTUP_PATH_PARAM);
  const query = url.searchParams.toString();
  const next = `${target}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(null, "", next);
}

export function emitMetadataSync(): void {
  broadcast({ type: "metadata-sync" });
}

export function onMetadataSync(callback: () => void): () => void {
  return subscribe((msg) => {
    if (msg.type === "metadata-sync") callback();
  });
}

export function onChatPresenceQuery(getChatId: () => string | null | undefined): () => void {
  return subscribe((msg) => {
    if (msg.type !== "presence-query") return;
    const myChatId = getChatId();
    if (myChatId && myChatId === msg.chatId) {
      broadcast({ type: "presence-response", chatId: myChatId });
    }
  });
}

export async function isChatOpenElsewhere(chatId: string, timeoutMs = 300): Promise<boolean> {
  if (typeof BroadcastChannel === "undefined") return false;
  return new Promise((resolve) => {
    let done = false;
    const unsubscribe = subscribe((msg) => {
      if (done) return;
      if (msg.type === "presence-response" && msg.chatId === chatId) {
        done = true;
        unsubscribe();
        resolve(true);
      }
    });
    broadcast({ type: "presence-query", chatId });
    setTimeout(() => {
      if (done) return;
      done = true;
      unsubscribe();
      resolve(false);
    }, timeoutMs);
  });
}
