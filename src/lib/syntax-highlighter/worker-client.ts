import { getLogger } from "@/lib/logger";

import type { HighlightRequest, HighlightResponse } from "./types";

const logger = getLogger(import.meta.url);

class WorkerClient {
  private worker: Worker;
  private pendingRequests = new Map<
    string,
    (response: HighlightResponse) => void
  >();
  private requestIdCounter = 0;
  private isInitialized = false;

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

  public highlight(
    code: string,
    language: string,
    theme: "dark-plus" | "light-plus" = "dark-plus",
  ): Promise<{ html: string | null; error: string | null }> {
    return new Promise((resolve) => {
      if (!this.isInitialized) {
        resolve({ html: null, error: "Worker not initialized" });
        return;
      }

      const id = `highlight-${++this.requestIdCounter}`;
      this.pendingRequests.set(id, (response) => {
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
