import { getLogger } from "@/lib/logger";

import type {
  HighlightLine,
  HighlightRequest,
  HighlightResponse,
  HighlightTheme,
  WorkerRequest,
} from "./types";

const logger = getLogger(import.meta.url);

const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_CODE_LENGTH = 2_000_000;

export interface HighlightedCode {
  lines: HighlightLine[];
  fg?: string;
}

export interface HighlightResult {
  highlighted: HighlightedCode | null;
  error: string | null;
}

type ClientSession = {
  lines: HighlightLine[];
  fg?: string;
  cacheKey?: string;
};

const getCacheKey = (code: string, language: string, theme: HighlightTheme) =>
  `${theme}\u0000${language}\u0000${code}`;

class WorkerClient {
  private worker: Worker;
  private pendingRequests = new Map<string, (response: HighlightResponse) => void>();
  private requestIdCounter = 0;
  private sessions = new Map<string, ClientSession>();
  private cache = new Map<string, HighlightedCode>();
  private cacheCodeLength = 0;

  constructor() {
    this.worker = new Worker(
      new URL("../../workers/syntax-highlighter.worker.ts", import.meta.url),
      { type: "module" },
    );

    this.worker.onmessage = (event: MessageEvent<HighlightResponse>) => {
      const { id } = event.data;
      const callback = this.pendingRequests.get(id);
      if (callback) {
        callback(event.data);
        this.pendingRequests.delete(id);
      }
    };

    this.worker.onerror = (error) => {
      logger.error("Syntax highlighter worker error:", error);
      this.pendingRequests.forEach((callback, id) => {
        callback({ id, error: "Worker error occurred" });
      });
      this.pendingRequests.clear();
      this.sessions.clear();
    };

    this.post({ type: "init" });
  }

  private post(request: WorkerRequest) {
    this.worker.postMessage(request);
  }

  public peekCached(code: string, language: string, theme: HighlightTheme = "dark-plus") {
    return this.cache.get(getCacheKey(code, language, theme));
  }

  public getCached(code: string, language: string, theme: HighlightTheme = "dark-plus") {
    const key = getCacheKey(code, language, theme);
    const highlighted = this.cache.get(key);
    if (highlighted !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, highlighted);
    }
    return highlighted;
  }

  private forgetKey(key: string) {
    if (this.cache.delete(key)) {
      this.cacheCodeLength -= key.length;
    }
  }

  private setCached(key: string, highlighted: HighlightedCode) {
    this.forgetKey(key);
    this.cache.set(key, highlighted);
    this.cacheCodeLength += key.length;

    while (
      this.cache.size > MAX_CACHE_ENTRIES ||
      (this.cacheCodeLength > MAX_CACHE_CODE_LENGTH && this.cache.size > 1)
    ) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.forgetKey(oldest);
    }
  }

  public dispose(sessionId: string) {
    if (this.sessions.delete(sessionId)) {
      this.post({ type: "dispose", sessionId });
    }
  }

  public highlight(
    sessionId: string,
    code: string,
    language: string,
    theme: HighlightTheme = "dark-plus",
  ): Promise<HighlightResult> {
    const existing = this.sessions.get(sessionId);
    const reset = !existing;
    const session: ClientSession = existing ?? { lines: [] };
    this.sessions.set(sessionId, session);

    return new Promise((resolve) => {
      const id = `highlight-${++this.requestIdCounter}`;
      this.pendingRequests.set(id, (response) => {
        if (response.error || !response.lines || response.startLine === undefined) {
          if (this.sessions.get(sessionId) === session) this.sessions.delete(sessionId);
          resolve({ highlighted: null, error: response.error ?? "Invalid highlight response" });
          return;
        }

        session.lines = [...session.lines.slice(0, response.startLine), ...response.lines];
        session.fg = response.fg ?? session.fg;

        const highlighted: HighlightedCode = {
          lines: response.partial ? [...session.lines, response.partial] : session.lines,
          fg: session.fg,
        };

        if (session.cacheKey) this.forgetKey(session.cacheKey);
        session.cacheKey = getCacheKey(code, language, theme);
        this.setCached(session.cacheKey, highlighted);

        resolve({ highlighted, error: null });
      });

      const request: HighlightRequest = {
        type: "highlight",
        id,
        sessionId,
        reset,
        code,
        language,
        theme,
      };
      this.post(request);
    });
  }
}

export const highlighterClient = new WorkerClient();
