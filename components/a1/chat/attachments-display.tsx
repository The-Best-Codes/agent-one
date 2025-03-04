import Image from "next/image";

interface Attachment {
  name: string;
  contentType: string;
  url: string;
}

interface AttachmentsDisplayProps {
  attachments: Attachment[];
}

export const AttachmentsDisplay: React.FC<AttachmentsDisplayProps> = ({
  attachments,
}) => {
  return (
    <div className="p-2 pt-0">
      <div className="flex flex-nowrap gap-2 pb-2 max-h-24 max-w-full overflow-x-auto overflow-y-hidden">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="group flex items-center gap-2 border rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors relative shrink-0"
          >
            {attachment.contentType.startsWith("image/") ? (
              <div className="relative h-10 w-10 rounded-md overflow-hidden">
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                <span className="text-xs text-muted-foreground uppercase">
                  {attachment.contentType.split("/")[1]?.substring(0, 3) ||
                    "file"}
                </span>
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate max-w-32">
                {attachment.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
