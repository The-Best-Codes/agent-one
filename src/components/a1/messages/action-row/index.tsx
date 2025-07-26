import { CopyButton } from "@/components/a1/copy-button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { RetryButton } from "./retry-button";

export const MessageActionRow = ({
  contentToCopy,
  messageRole,
  messageId,
}: {
  contentToCopy: string;
  messageRole: UIMessage["role"];
  messageId: UIMessage["id"];
}) => {
  return (
    <div
      className={cn(
        "mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100 transition-opacity duration-300 ease flex gap-1",
        messageRole !== "user" && "ml-2",
      )}
    >
      <CopyButton
        className="w-6 h-6"
        variants={{
          idle: "secondary",
          copying: "secondary",
          success: "secondary",
          error: "secondary",
        }}
        text={contentToCopy}
      />
      {messageRole === "assistant" && (
        <RetryButton messageId={messageId} className="w-6 h-6" />
      )}
    </div>
  );
};
