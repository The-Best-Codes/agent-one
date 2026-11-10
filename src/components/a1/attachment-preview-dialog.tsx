import { IconExternalLink, IconFile, IconFileOff, IconFolder } from "@tabler/icons-react";
import { readFile, stat } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { attachmentPreviewAtom, getFileKind, getMediaType, isTextContent } from "@/lib/attachments";
import { getFileName } from "@/lib/file-icons";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const MAX_PREVIEW_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;

type Loaded =
  | { status: "missing" }
  | { status: "folder" }
  | { status: "none" }
  | { status: "text"; text: string }
  | { status: "media"; kind: "image" | "video" | "audio" | "pdf"; url: string };

async function loadPreview(path: string): Promise<Loaded> {
  let bytes: Uint8Array;
  try {
    const info = await stat(path);
    if (info.isDirectory) return { status: "folder" };
    if (info.size > MAX_PREVIEW_BYTES) return { status: "none" };
    bytes = await readFile(path);
  } catch (error) {
    logger.warn("Failed to load attachment preview", error);
    return { status: "missing" };
  }

  const mediaType = getMediaType(path);
  const kind = getFileKind(mediaType);
  if (kind !== "other") {
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mediaType }));
    return { status: "media", kind, url };
  }
  if (!isTextContent(bytes)) return { status: "none" };
  return {
    status: "text",
    text: new TextDecoder().decode(bytes.subarray(0, MAX_TEXT_CHARS * 4)).slice(0, MAX_TEXT_CHARS),
  };
}

function PreviewBody({ loaded, name }: { loaded: Loaded; name: string }) {
  if (loaded.status === "text") {
    return (
      <pre className="bg-muted/40 size-full overflow-auto rounded-md border p-2 font-mono text-xs whitespace-pre-wrap">
        {loaded.text}
      </pre>
    );
  }
  if (loaded.status === "media") {
    switch (loaded.kind) {
      case "image":
        return <img src={loaded.url} alt={name} className="size-full object-contain" />;
      case "video":
        return <video src={loaded.url} controls className="size-full rounded-md" />;
      case "audio":
        return <audio src={loaded.url} controls className="w-full" />;
      case "pdf":
        return <iframe src={loaded.url} title={name} className="size-full rounded-md border" />;
    }
  }
  if (loaded.status === "folder") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconFolder />
          </EmptyMedia>
          <EmptyTitle>This is a folder</EmptyTitle>
          <EmptyDescription>Open it in your file manager to see what's inside.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  const missing = loaded.status === "missing";
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{missing ? <IconFileOff /> : <IconFile />}</EmptyMedia>
        <EmptyTitle>{missing ? "File not found" : "No preview available"}</EmptyTitle>
        <EmptyDescription>
          {missing
            ? "This file was moved or deleted, so it can't be shown."
            : "AgentOne can't show this file. Open it in another app to see it."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function AttachmentPreviewDialog() {
  const [path, setPath] = useAtom(attachmentPreviewAtom);
  const [shownPath, setShownPath] = useState(path);
  const [loaded, setLoaded] = useState<{ path: string; result: Loaded } | null>(null);

  if (path && path !== shownPath) setShownPath(path);

  useEffect(() => {
    if (!shownPath) return;
    let cancelled = false;
    let url: string | undefined;
    void loadPreview(shownPath).then((result) => {
      if (result.status === "media") url = result.url;
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      setLoaded({ path: shownPath, result });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setLoaded(null);
    };
  }, [shownPath]);

  const name = shownPath ? getFileName(shownPath) : "";
  const result = loaded?.path === shownPath ? loaded.result : null;

  return (
    <Dialog open={!!path} onOpenChange={(open) => !open && setPath(null)}>
      <DialogContent className="sm:max-w-2xl" onCloseAutoFocus={() => setShownPath(null)}>
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="truncate">{name}</DialogTitle>
          <DialogDescription className="truncate" title={shownPath ?? undefined}>
            {shownPath}
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-[min(60vh,36rem)] min-h-0 items-center justify-center">
          {result ? (
            <PreviewBody loaded={result} name={name} />
          ) : (
            <Skeleton className="size-full" />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={!shownPath || !result || result.status === "missing"}
            onClick={() => {
              if (!shownPath) return;
              void openPath(shownPath).catch((error: unknown) => {
                logger.error("Failed to open attachment", error);
              });
            }}
          >
            <IconExternalLink data-icon="inline-start" />
            Open in default app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
