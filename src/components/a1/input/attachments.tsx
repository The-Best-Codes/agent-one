import { Button } from "@/components/ui/button";
import formatBytes from "@/lib/format-bytes";
import { FileIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
      <div className="flex flex-nowrap gap-2 pb-2 max-h-28 max-w-full overflow-x-auto overflow-y-hidden">
        {Array.from(files).map((file, index) => (
          <div
            key={index}
            className="group flex items-center gap-2 border rounded-md p-2 bg-background relative shrink-0 min-w-0"
          >
            {previews[index]?.type === "image" ? (
              <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                <img
                  src={previews[index].url}
                  alt={file.name}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="h-12 w-12 flex items-center justify-center bg-muted/70 rounded-md border relative">
                <FileIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
              <span
                className="text-sm font-medium truncate max-w-36"
                title={file.name}
              >
                {file.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity shrink-0"
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
