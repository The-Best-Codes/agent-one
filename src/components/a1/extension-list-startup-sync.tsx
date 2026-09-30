import { useEffect } from "react";

import { syncExtensionListOnStartup } from "@/lib/mcp-registry/sync";

export function ExtensionListStartupSync() {
  useEffect(() => {
    void syncExtensionListOnStartup();
  }, []);

  return null;
}
