import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { scan, setOptions } from "react-scan";

import { reactScanEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

export function ReactScan() {
  const enabled = useAtomValue(reactScanEnabledAtom);

  useEffect(() => {
    if (enabled) {
      scan({
        enabled: true,
        dangerouslyForceRunInProduction: true,
        showToolbar: true,
      });
    } else {
      setOptions({ enabled: false, showToolbar: false });
    }
  }, [enabled]);

  return null;
}
