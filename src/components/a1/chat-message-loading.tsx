import type { UIMessage } from "ai";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  let text = t("messages.working");
  if (isMcpLoading) text = t("messages.startingExtensions");
  if (isApiKeysLoading) text = t("messages.bootingUp");

  return (
    <span className="shimmer dark:shimmer-color-accent text-foreground w-fit text-sm font-bold">
      {text}
    </span>
  );
};

export const ChatMessageLoading = ({
  mode = "inLayout",
  messageId,
  messageRole,
}: {
  mode?: "inLayout" | "inMessage";
  messageId?: string;
  messageRole?: UIMessage["role"];
}) => {
  const { status } = useChatStatus();
  const messages = useChatMessages();
  const { isApiKeysLoading } = useApiKeys();
  const { isMcpLoading } = useTools();

  const lastOverallMessage = messages[messages.length - 1];
  const isLatestMessageOverall = lastOverallMessage?.id === messageId;

  if (mode === "inMessage") {
    if (!isLatestMessageOverall || messageRole !== "assistant") {
      return null;
    }

    if (status === "streaming") {
      return <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />;
    }

    if (status === "submitted" && lastOverallMessage.role === "assistant") {
      return <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />;
    }

    return null;
  }

  if (mode === "inLayout") {
    if (status === "streaming") {
      return null;
    }

    if (status === "submitted") {
      if (!lastOverallMessage || lastOverallMessage.role === "user") {
        return (
          <div className="justify-end p-2">
            <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />
          </div>
        );
      }

      return null;
    }
  }

  return null;
};
