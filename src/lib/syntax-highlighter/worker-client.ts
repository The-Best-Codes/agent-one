import { getLogger } from "@/lib/logger";

import type { HighlightRequest, HighlightResponse } from "./types";

const logger = getLogger(import.meta.url);

const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_HTML_LENGTH = 5_000_000;

type HighlightTheme = "dark-plus" | "light-plus";

const getCacheKey = (code: string, language: string, theme: HighlightTheme) =>
  `${theme}\u0000${language}\u0000${code}`;

class WorkerClient {
  private worker: Worker;
  private pendingRequests = new Map<string, (response: HighlightResponse) => void>();
  private requestIdCounter = 0;
  private isInitialized = false;
  private cache = new Map<string, string>();
  private cacheHtmlLength = 0;

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
    };

    this.worker.postMessage({ type: "init" });
    this.isInitialized = true;
  }

  public getCached(code: string, language: string, theme: HighlightTheme = "dark-plus") {
    const key = getCacheKey(code, language, theme);
    const html = this.cache.get(key);
    if (html !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, html);
    }
    return html;
  }

  public forget(code: string, language: string, theme: HighlightTheme = "dark-plus") {
    const key = getCacheKey(code, language, theme);
    const html = this.cache.get(key);
    if (html !== undefined) {
      this.cache.delete(key);
      this.cacheHtmlLength -= html.length;
    }
  }

  private setCached(code: string, language: string, theme: HighlightTheme, html: string) {
    this.forget(code, language, theme);
    this.cache.set(getCacheKey(code, language, theme), html);
    this.cacheHtmlLength += html.length;

    while (
      this.cache.size > MAX_CACHE_ENTRIES ||
      (this.cacheHtmlLength > MAX_CACHE_HTML_LENGTH && this.cache.size > 1)
    ) {
      const oldest = this.cache.entries().next().value;
      if (!oldest) break;
      this.cache.delete(oldest[0]);
      this.cacheHtmlLength -= oldest[1].length;
    }
  }

  public highlight(
    code: string,
    language: string,
    theme: HighlightTheme = "dark-plus",
  ): Promise<{ html: string | null; error: string | null }> {
    const cachedHtml = this.getCached(code, language, theme);
    if (cachedHtml !== undefined) {
      return Promise.resolve({ html: cachedHtml, error: null });
    }

    return new Promise((resolve) => {
      if (!this.isInitialized) {
        resolve({ html: null, error: "Worker not initialized" });
        return;
      }

      const id = `highlight-${++this.requestIdCounter}`;
      this.pendingRequests.set(id, (response) => {
        if (response.html) {
          this.setCached(code, language, theme, response.html);
        }
        resolve({
          html: response.html || null,
          error: response.error || null,
        });
      });

      const request: HighlightRequest = { id, code, language, theme };
      this.worker.postMessage(request);
    });
  }
}

export const highlighterClient = new WorkerClient();
