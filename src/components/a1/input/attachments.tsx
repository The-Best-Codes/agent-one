import { FileIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import formatBytes from "@/lib/format-bytes";

interface AttachmentsProps {
  files: FileList;
  onRemove: (index: number) => void;
}

export const Attachments: React.FC<AttachmentsProps> = ({
  files,
  onRemove,
}) => {
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
            key={index}
            className="bg-background relative flex min-w-0 shrink-0 items-center gap-2 rounded-md border p-2"
          >
            {previews[index]?.type === "image" ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                <img
                  src={previews[index].url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-muted/70 relative flex h-12 w-12 items-center justify-center rounded-md border">
                <FileIcon className="text-muted-foreground h-6 w-6" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span
                className="max-w-36 truncate text-sm font-medium"
                title={file.name}
              >
                {file.name}
              </span>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>{formatBytes(file.size)}</span>
                {file.type && (
                  <>
                    <span>&middot;</span>
                    <span className="truncate">{file.type}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(index)}
              className="h-6 w-6 shrink-0 opacity-60 transition-opacity hover:opacity-100"
              title="Remove file"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
