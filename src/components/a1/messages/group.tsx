import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { CopyButton } from "../copy-button";

export const MessageGroup = ({
  children,
  messageRole,
  contentToCopy,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
  contentToCopy: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col group wrap-anywhere",
        messageRole === "user"
          ? "max-w-3/4 items-end"
          : "max-w-full items-start",
      )}
    >
      <div
        className={cn(
          "rounded-md max-w-full",
          messageRole === "user"
            ? "bg-secondary text-secondary-foreground p-2"
            : "p-2 pb-0",
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease",
          messageRole !== "user" && "ml-2",
        )}
      >
        <CopyButton
          className="w-4 h-4 bg-transparent hover:bg-transparent"
          variants={{
            idle: "ghost",
            copying: "ghost",
            success: "ghost",
            error: "ghost",
          }}
          text={contentToCopy}
        />
      </div>
    </div>
  );
};
