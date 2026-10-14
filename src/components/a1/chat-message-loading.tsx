import type { UIMessage } from "ai";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";

const LoadingIndicator = ({
  isApiKeysLoading,
  isMcpLoading,
}: {
  isApiKeysLoading: boolean;
  isMcpLoading: boolean;
}) => {
  let text = "Working";
  if (isMcpLoading) text = "Starting extensions";
  if (isApiKeysLoading) text = "Booting up";

  return (
    <span className="shimmer shimmer-with-pause shimmer-spread-2 shimmer-duration-1000 dark:text-muted-foreground text-foreground w-fit text-sm font-bold [--shimmer-pause:1000ms]">
      {text}
    </span>
  );
};

const InMessageLoading = ({
  isLastMessage,
  messageRole,
}: {
  isLastMessage?: boolean;
  messageRole?: UIMessage["role"];
}) => {
  const { status } = useChatStatus();
  const { isApiKeysLoading } = useApiKeys();
  const { isMcpLoading } = useTools();

  if (!isLastMessage || messageRole !== "assistant") {
    return null;
  }

  if (status === "streaming" || status === "submitted") {
    return <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />;
  }

  return null;
};

const InLayoutLoading = () => {
  const { status } = useChatStatus();
  const messages = useChatMessages();
  const { isApiKeysLoading } = useApiKeys();
  const { isMcpLoading } = useTools();

  const lastOverallMessage = messages[messages.length - 1];

  if (status === "submitted" && (!lastOverallMessage || lastOverallMessage.role === "user")) {
    return (
      <div className="justify-end p-2">
        <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />
      </div>
    );
  }

  return null;
};

export const ChatMessageLoading = ({
  mode = "inLayout",
  isLastMessage,
  messageRole,
}: {
  mode?: "inLayout" | "inMessage";
  isLastMessage?: boolean;
  messageRole?: UIMessage["role"];
}) => {
  if (mode === "inMessage") {
    return <InMessageLoading isLastMessage={isLastMessage} messageRole={messageRole} />;
  }

  return <InLayoutLoading />;
};
