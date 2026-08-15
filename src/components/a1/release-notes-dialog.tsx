import { IconRocket } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import packageJson from "@/../package.json";
import { getReleaseNotes } from "@/assets/release-notes";
import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { releaseNotesLastSeenVersionAtom } from "@/lib/jotai/atoms";

export function ReleaseNotesDialog() {
  const { t } = useTranslation();
  const [lastSeenVersion, setLastSeenVersion] = useAtom(releaseNotesLastSeenVersionAtom);
  const currentVersion = packageJson.version;

  const releaseNotesData = useMemo(() => {
    if (lastSeenVersion === null || lastSeenVersion === currentVersion) {
      return null;
    }

    const notes = getReleaseNotes(currentVersion);
    if (!notes) {
      return null;
    }

    return { content: notes, version: currentVersion };
  }, [lastSeenVersion, currentVersion]);

  useEffect(() => {
    if (lastSeenVersion === null) {
      setLastSeenVersion(currentVersion);
    }
  }, [currentVersion, lastSeenVersion, setLastSeenVersion]);

  const handleClose = () => {
    setLastSeenVersion(currentVersion);
  };

  if (!releaseNotesData) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <IconRocket className="text-primary size-5" />
            <DialogTitle>
              {t("dialogs.releaseNotesTitle", { version: releaseNotesData.version })}
            </DialogTitle>
          </div>
          <DialogDescription>{t("dialogs.releaseNotesDescription")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm prose-neutral dark:prose-invert prose-quoteless px-1">
            <MemoizedMarkdown
              allowInternalLinks
              content={releaseNotesData.content}
              id="release-notes"
              messageRole="assistant"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>{t("common.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
