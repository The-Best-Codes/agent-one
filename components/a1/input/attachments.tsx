import { Button } from "@/components/ui/button";
import formatBytes from "@/utils/formatBytes";
import { X } from "lucide-react";
import Image from "next/image";
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
    // Generate previews for new files
    const newPreviews = Array.from(files).map((file) => {
      const fileType = file.type.split("/")[0]; // 'image', 'text', etc.
      const url = URL.createObjectURL(file);
      previewUrls.current.push(url);
      return {
        url: url,
        type: fileType,
      };
    });

    setPreviews(newPreviews);

    // Clean up object URLs on unmount
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current = []; // Clear the ref
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
      <div className="flex flex-nowrap gap-2 pb-2 max-h-24 max-w-full overflow-x-auto overflow-y-hidden">
        {Array.from(files).map((file, index) => (
          <div
            key={index}
            className="group flex items-center gap-2 border rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors relative shrink-0"
          >
            {previews[index]?.type === "image" ? (
              <div className="relative h-10 w-10 rounded-md overflow-hidden">
                <Image
                  src={previews[index].url}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                <span className="text-xs text-muted-foreground uppercase">
                  {file.type.split("/")[1]?.substring(0, 3) || "file"}
                </span>
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate max-w-32">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(index)}
              className="h-6 w-6 ml-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
