import { useAtom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";

import packageJson from "@/../package.json";
import { releaseNotesLastSeenVersionAtom } from "@/lib/jotai/atoms";
import { openExternalUrl } from "@/lib/open-external-url";
import { RELEASE_POST_URLS } from "@/lib/release-posts";

const TOAST_ID = "app-updated";

export function UpdateToast() {
  const [lastSeenVersion, setLastSeenVersion] = useAtom(releaseNotesLastSeenVersionAtom);
  const currentVersion = packageJson.version;

  useEffect(() => {
    if (lastSeenVersion === currentVersion) return;
    setLastSeenVersion(currentVersion);
    if (lastSeenVersion === null) return;

    const url = RELEASE_POST_URLS[currentVersion];
    toast.success(`Updated to v${currentVersion}`, {
      id: TOAST_ID,
      duration: Infinity,
      action: url ? { label: "What's new", onClick: () => openExternalUrl(url) } : undefined,
    });
  }, [currentVersion, lastSeenVersion, setLastSeenVersion]);

  return null;
}
