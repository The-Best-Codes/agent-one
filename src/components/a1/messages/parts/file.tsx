import type { FileUIPart } from "ai";
import { FileIcon, FileImageIcon, FileTextIcon } from "lucide-react";

export const MessagePartFile = ({ file }: { file: FileUIPart }) => {
  const isImage = file.mediaType?.startsWith("image/");
  const isPdf = file.mediaType === "application/pdf";
  const isText =
    file.mediaType?.startsWith("text/") ||
    file.mediaType?.includes("json") ||
    file.mediaType?.includes("xml");

  if (isImage) {
    return (
      <div className="max-w-48 overflow-hidden rounded-md border">
        <img
          src={file.url}
          alt={file.filename || "Attached image"}
          className="h-auto w-full"
          loading="lazy"
        />
        {file.filename && (
          <div className="bg-background border-t p-2">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <FileImageIcon />
              <span className="truncate">{file.filename}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="max-w-48 overflow-hidden rounded-md border">
        <iframe
          src={file.url}
          title={file.filename || "PDF Document"}
          className="h-96 w-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
        {file.filename && (
          <div className="bg-background border-t p-2">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <FileIcon />
              <span className="truncate">{file.filename} &middot; PDF</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const getFileIcon = () => {
    if (isText) return <FileTextIcon />;
    return <FileIcon className="text-muted-foreground" />;
  };

  const getFileTypeLabel = () => {
    if (isPdf) return "PDF";
    if (isText) return "Text";
    return file.mediaType?.split("/")[1]?.toUpperCase() || "FILE";
  };

  return (
    <div className="bg-background flex max-w-48 items-center gap-2 rounded-md border p-2">
      <div className="bg-background flex size-12 items-center justify-center rounded-md border">
        {getFileIcon()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-medium" title={file.filename}>
          {file.filename || "Attached file"}
        </span>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span>{getFileTypeLabel()}</span>
          {file.mediaType && (
            <>
              <span>&middot;</span>
              <span className="truncate">{file.mediaType}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
