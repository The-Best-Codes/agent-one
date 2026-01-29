import { useAtomValue } from "jotai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";

import {
  cerebrasApiKeyLoadableAtom,
  googleGenerativeAiApiKeyLoadableAtom,
  groqApiKeyLoadableAtom,
  openrouterApiKeyLoadableAtom,
} from "@/lib/jotai/api-key-atoms";
import { getLogger } from "@/lib/logger";

import { ApiKeysContext } from "./api-keys-contexts";

const logger = getLogger(import.meta.url);

export const ApiKeysProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const google = useAtomValue(googleGenerativeAiApiKeyLoadableAtom);
  const groq = useAtomValue(groqApiKeyLoadableAtom);
  const openrouter = useAtomValue(openrouterApiKeyLoadableAtom);
  const cerebras = useAtomValue(cerebrasApiKeyLoadableAtom);

  const loadables = useMemo(
    () => [google, groq, openrouter, cerebras],
    [google, groq, openrouter, cerebras],
  );

  const isApiKeysLoading = loadables.some((l) => l.state === "loading");

  const deferredRef = useRef<{
    promise: Promise<void>;
    resolve: () => void;
  } | null>(null);

  const getApiKeysLoadedPromise = useCallback(() => {
    if (!isApiKeysLoading) return Promise.resolve();

    if (!deferredRef.current) {
      let resolveRef: () => void;
      const promise = new Promise<void>((resolve) => {
        resolveRef = resolve;
      });
      deferredRef.current = { promise, resolve: resolveRef! };
    }

    return deferredRef.current.promise;
  }, [isApiKeysLoading]);

  useEffect(() => {
    if (!isApiKeysLoading && deferredRef.current) {
      logger.verbose(
        "All API keys have finished loading, resolving pending promises",
      );
      deferredRef.current.resolve();
      deferredRef.current = null;
    }
  }, [isApiKeysLoading]);

  const value = useMemo(
    () => ({
      isApiKeysLoading,
      getApiKeysLoadedPromise,
    }),
    [isApiKeysLoading, getApiKeysLoadedPromise],
  );

  return (
    <ApiKeysContext.Provider value={value}>{children}</ApiKeysContext.Provider>
  );
};
