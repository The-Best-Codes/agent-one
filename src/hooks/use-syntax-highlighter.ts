import { useCallback, useEffect, useRef } from "react";

interface HighlightRequest {
  id: string;
  code: string;
  language: string;
  theme: "dark-plus" | "light-plus";
}

interface HighlightResponse {
  id: string;
  html?: string;
  error?: string;
}

interface HighlightResult {
  html: string | null;
  loading: boolean;
  error: string | null;
}

const useSyntaxHighlighter = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<
    Map<string, (result: HighlightResult) => void>
  >(new Map());
  const requestIdCounter = useRef(0);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/syntax-highlighter.worker.ts", import.meta.url),
      { type: "module" },
    );

    const pendingRequests = pendingRequestsRef.current;

    workerRef.current.onmessage = (event: MessageEvent<HighlightResponse>) => {
      const { id, html, error } = event.data;
      const callback = pendingRequestsRef.current.get(id);

      if (callback) {
        callback({
          html: html || null,
          loading: false,
          error: error || null,
        });
        pendingRequestsRef.current.delete(id);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Syntax highlighter worker error:", error);
      pendingRequestsRef.current.forEach((callback) => {
        callback({
          html: null,
          loading: false,
          error: "Worker error occurred",
        });
      });
      pendingRequestsRef.current.clear();
    };

    workerRef.current.postMessage({ type: "init" });

    return () => {
      workerRef.current?.terminate();
      pendingRequests.clear();
    };
  }, []);

  const highlight = useCallback(
    (
      code: string,
      language: string,
      theme: "dark-plus" | "light-plus" = "dark-plus",
    ): Promise<HighlightResult> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          resolve({
            html: null,
            loading: false,
            error: "Worker not initialized",
          });
          return;
        }

        const id = `highlight-${++requestIdCounter.current}`;

        pendingRequestsRef.current.set(id, resolve);

        const request: HighlightRequest = {
          id,
          code,
          language,
          theme,
        };

        workerRef.current.postMessage(request);
      });
    },
    [],
  );

  return { highlight };
};

export default useSyntaxHighlighter;
