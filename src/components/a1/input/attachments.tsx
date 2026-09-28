import { IconFile, IconMessageCircle, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import formatBytes from "@/lib/format-bytes";

interface AttachmentsProps {
  files: FileList;
  onRemove: (index: number) => void;
}

export const Attachments: React.FC<AttachmentsProps> = ({ files, onRemove }) => {
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];

    const newPreviews = Array.from(files).map((file) => {
      const fileType = file.type.split("/")[0];
      const url = URL.createObjectURL(file);
      previewUrls.current.push(url);
      return {
        url: url,
        type: fileType,
      };
    });

    setPreviews(newPreviews);

    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = [];
    };
  }, [files]);

  const handleRemove = useCallback(
    (index: number) => {
      onRemove(index);
    },
    [onRemove],
  );

  return (
    <div className="px-2 pb-1">
      <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
        {Array.from(files).map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            className="bg-background flex min-w-0 shrink-0 items-center gap-1.5 rounded-md border p-1"
          >
            {previews[index]?.type === "image" ? (
              <div className="size-8 shrink-0 overflow-hidden rounded-sm">
                <img
                  src={previews[index].url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : file.name.includes("_agent-one_chat") ? (
              <div className="bg-muted/70 flex size-8 shrink-0 items-center justify-center rounded-sm">
                <IconMessageCircle className="text-muted-foreground" />
              </div>
            ) : (
              <div className="bg-muted/70 flex size-8 shrink-0 items-center justify-center rounded-sm">
                <IconFile className="text-muted-foreground" />
              </div>
            )}
            <div className="flex max-w-32 min-w-0 flex-col">
              <span className="truncate text-xs font-medium" title={file.name}>
                {file.name}
              </span>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <span className="tabular-nums">{formatBytes(file.size)}</span>
              </div>
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => handleRemove(index)}
              aria-label={`Remove ${file.name}`}
              title={`Remove ${file.name}`}
            >
              <IconX />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
