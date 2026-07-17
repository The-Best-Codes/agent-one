import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

import { reactScanEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

export function ReactScan() {
  const enabled = useAtomValue(reactScanEnabledAtom);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      return;
    }
    void import("react-scan").then(({ scan, setOptions }) => {
      scan({ enabled: true, dangerouslyForceRunInProduction: true, showToolbar: true });
      cleanupRef.current = () => setOptions({ enabled: false, showToolbar: false });
    });
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [enabled]);

  return null;
}
