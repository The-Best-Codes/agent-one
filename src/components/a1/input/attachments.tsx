import { IconFile, IconMessageCircle, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import formatBytes from "@/lib/format-bytes";

interface AttachmentsProps {
  files: FileList;
  onRemove: (index: number) => void;
}

export const Attachments: React.FC<AttachmentsProps> = ({ files, onRemove }) => {
  const { t } = useTranslation();
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
    <div className="p-2 pt-0">
      <div className="flex max-h-28 max-w-full flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-2">
        {Array.from(files).map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${file.lastModified}`}
            className="bg-background relative flex min-w-0 shrink-0 items-center gap-2 rounded-md border p-2"
          >
            {previews[index]?.type === "image" ? (
              <div className="relative size-12 overflow-hidden rounded-md border">
                <img
                  src={previews[index].url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : file.name.includes("_agent-one_chat") ? (
              <div className="bg-muted/70 relative flex size-12 items-center justify-center rounded-md border">
                <IconMessageCircle className="text-muted-foreground" />
              </div>
            ) : (
              <div className="bg-muted/70 relative flex size-12 items-center justify-center rounded-md border">
                <IconFile className="text-muted-foreground" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="max-w-36 truncate text-sm font-medium" title={file.name}>
                {file.name}
              </span>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="tabular-nums">{formatBytes(file.size)}</span>
                {file.type && (
                  <>
                    <span>&middot;</span>
                    <span className="truncate">
                      {file.name.includes("_agent-one_chat")
                        ? t("chat.attachmentTypeChat")
                        : file.type}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(index)}
              className="size-6 shrink-0 opacity-60 transition-opacity hover:opacity-100"
              title={t("common.removeFile")}
            >
              <IconX data-icon="inline-start" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
