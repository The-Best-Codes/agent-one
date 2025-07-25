import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { CopyButton } from "../copy-button";
import { RetryButton } from "../retry-button";

export const MessageGroup = ({
  children,
  messageRole,
  contentToCopy,
  messageId,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
  contentToCopy: string;
  messageId: string;
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
          "mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100 transition-opacity duration-300 ease flex gap-1",
          messageRole !== "user" && "ml-2",
        )}
      >
        <CopyButton
          className="w-6 h-6"
          variants={{
            idle: "ghost",
            copying: "ghost",
            success: "ghost",
            error: "ghost",
          }}
          text={contentToCopy}
        />
        {messageRole === "assistant" && (
          <RetryButton messageId={messageId} className="w-6 h-6" />
        )}
      </div>
    </div>
  );
};
