import { useEffect, useRef } from "react";

import { SyncEngine } from "./sync-engine";
import type { SyncOptions } from "./sync-types";

export function useSyncData<T>(
  key: string,
  getValue: () => T,
  setValue: (data: T) => void,
  options?: SyncOptions,
) {
  const unlistenRef = useRef<Array<() => Promise<void>>>([]);
  const configRef = useRef({
    timeout: options?.timeout ?? 5000,
    logging: options?.logging ?? false,
    deepCompare: options?.deepCompare ?? true,
  });

  useEffect(() => {
    const config = configRef.current;

    SyncEngine.registerSync(key, config);

    const unlistenFunctions: Array<() => Promise<void>> = [];

    const updateHandler = (data: T) => {
      SyncEngine.setProcessing(key, true);
      setValue(data);
      SyncEngine.setProcessing(key, false);
    };

    const getter = getValue;
    const hydrationResponseHandler = async () =>
      SyncEngine.onHydrateResponse(key, updateHandler);

    const hydrateRequestHandler = async () =>
      SyncEngine.onHydrateRequest(key, getter);

    const updateListener = async () => SyncEngine.onUpdate(key, updateHandler);

    Promise.all([
      updateListener().then((u) => unlistenFunctions.push(u)),
      hydrateRequestHandler().then((u) => unlistenFunctions.push(u)),
      hydrationResponseHandler().then((u) => unlistenFunctions.push(u)),
    ]).then(() => {
      if (config.logging) {
        console.debug(`Sync listeners registered for key: ${key}`);
      }

      SyncEngine.hydrateRequest(key);
    });

    unlistenRef.current = unlistenFunctions;

    return () => {
      Promise.all(unlistenRef.current.map((u) => u())).then(() => {
        if (config.logging) {
          console.debug(`Sync listeners cleaned up for key: ${key}`);
        }
      });
    };
  }, [key, getValue, setValue]);

  return {
    broadcastUpdate: (data: T) => SyncEngine.broadcastUpdate(key, data),
    hydrateRequest: () => SyncEngine.hydrateRequest(key),
  };
}
