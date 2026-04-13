import { IconRocket } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import packageJson from "@/../package.json";
import { getReleaseNotes } from "@/assets/release-notes";
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
      void setLastSeenVersion(currentVersion);
    }
  }, [currentVersion, lastSeenVersion, setLastSeenVersion]);

  const handleClose = () => {
    void setLastSeenVersion(currentVersion);
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
            <DialogTitle>What's New in v{releaseNotesData.version}</DialogTitle>
          </div>
          <DialogDescription>A quick look at what changed in this release.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm prose-neutral dark:prose-invert px-1">
            <ReactMarkdown
              remarkPlugins={[remarkBreaks, remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                a({ node, ...props }) {
                  return <a {...props} target="_blank" rel="noopener noreferrer" />;
                },
              }}
            >
              {releaseNotesData.content}
            </ReactMarkdown>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
