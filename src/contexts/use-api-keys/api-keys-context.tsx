import { useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  cerebrasApiKeyLoadableAtom,
  googleGenerativeAiApiKeyLoadableAtom,
  groqApiKeyLoadableAtom,
  openrouterApiKeyLoadableAtom,
} from "@/lib/jotai/api-key-atoms";
import { getLogger } from "@/lib/logger";

import { ApiKeysContext } from "./api-keys-contexts";

const logger = getLogger(import.meta.url);

export interface ApiKeysContextType {
  isApiKeysLoading: boolean;
  apiKeysLoaded: boolean;
  getApiKeysLoadedPromise: () => Promise<void>;
}

interface ApiKeysProviderProps {
  children: ReactNode;
}

export const ApiKeysProvider: React.FC<ApiKeysProviderProps> = ({
  children,
}) => {
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(true);
  const [apiKeysLoaded, setApiKeysLoaded] = useState(false);

  const apiKeysLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const resolvePromiseRef = useRef<(() => void) | null>(null);

  // Call hooks at component level, not inside useMemo
  const googleLoadable = useAtomValue(
    loadable(googleGenerativeAiApiKeyLoadableAtom),
  );
  const groqLoadable = useAtomValue(loadable(groqApiKeyLoadableAtom));
  const openrouterLoadable = useAtomValue(
    loadable(openrouterApiKeyLoadableAtom),
  );
  const cerebrasLoadable = useAtomValue(loadable(cerebrasApiKeyLoadableAtom));

  const apiKeyLoadables = useMemo(
    () => [googleLoadable, groqLoadable, openrouterLoadable, cerebrasLoadable],
    [googleLoadable, groqLoadable, openrouterLoadable, cerebrasLoadable],
  );

  useEffect(() => {
    const currentlyLoading = apiKeyLoadables.some(
      (loadable) => loadable.state === "loading",
    );
    const currentlyLoaded = apiKeyLoadables.every(
      (loadable) =>
        loadable.state === "hasData" || loadable.state === "hasError",
    );

    // Defer state updates to avoid setState-in-effect
    const updateStates = () => {
      if (currentlyLoading && !isApiKeysLoading) {
        setIsApiKeysLoading(true);
        setApiKeysLoaded(false);
      }

      if (currentlyLoaded && !apiKeysLoadedRef.current) {
        setIsApiKeysLoading(false);
        setApiKeysLoaded(true);
        apiKeysLoadedRef.current = true;

        if (resolvePromiseRef.current) {
          resolvePromiseRef.current();
          resolvePromiseRef.current = null;
        }

        logger.verbose("All API keys have finished loading");
      }
    };

    const timeoutId = setTimeout(updateStates, 0);
    return () => clearTimeout(timeoutId);
  }, [apiKeyLoadables, isApiKeysLoading]);

  const getApiKeysLoadedPromise = useCallback(() => {
    if (apiKeysLoadedRef.current) {
      return Promise.resolve();
    }

    if (loadingPromiseRef.current && !resolvePromiseRef.current) {
      return loadingPromiseRef.current;
    }

    loadingPromiseRef.current = new Promise<void>((resolve) => {
      resolvePromiseRef.current = resolve;
    });

    return loadingPromiseRef.current;
  }, []);

  return (
    <ApiKeysContext.Provider
      value={{ isApiKeysLoading, apiKeysLoaded, getApiKeysLoadedPromise }}
    >
      {children}
    </ApiKeysContext.Provider>
  );
};
