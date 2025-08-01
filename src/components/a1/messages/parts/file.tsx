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
      <div className="max-w-md rounded-md overflow-hidden border">
        <img
          src={file.url}
          alt={file.filename || "Attached image"}
          className="w-full h-auto"
          loading="lazy"
        />
        {file.filename && (
          <div className="p-2 bg-background border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileImageIcon className="h-3 w-3" />
              {file.filename}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="max-w-lg border rounded-md overflow-hidden">
        <iframe
          src={file.url}
          title={file.filename || "PDF Document"}
          className="w-full h-96 border-0"
          sandbox="allow-scripts allow-same-origin"
        />
        {file.filename && (
          <div className="p-2 bg-background border-t">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileIcon className="h-3 w-3" />
              {file.filename} &middot; PDF
            </div>
          </div>
        )}
      </div>
    );
  }

  const getFileIcon = () => {
    if (isText) return <FileTextIcon className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  };

  const getFileTypeLabel = () => {
    if (isPdf) return "PDF";
    if (isText) return "Text";
    return file.mediaType?.split("/")[1]?.toUpperCase() || "FILE";
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-background max-w-sm">
      <div className="h-12 w-12 flex items-center justify-center bg-background rounded-md border">
        {getFileIcon()}
      </div>
      <div className="flex flex-col overflow-hidden min-w-0 flex-1">
        <span className="text-sm font-medium truncate" title={file.filename}>
          {file.filename || "Attached file"}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
