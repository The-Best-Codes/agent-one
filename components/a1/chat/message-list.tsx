import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "ai";
import ChatMessage from "./chat-message";
import React from "react";

interface ChatMessagesListProps {
  messages: Message[];
  isLoading: boolean;
  isSubmitted: boolean;
}

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
  messages,
  isLoading,
  isSubmitted,
}) => {
  const isToolInvocationLoading = (messageIndex: number, partIndex: number) => {
    if (messages.length === 0 || !isLoading) {
      return false;
    }

    const message = messages[messageIndex];

    if (!message || !message.parts) {
      return false;
    }

    const part = message.parts[partIndex];

    if (part?.type !== "tool-invocation") {
      return false; // Not a tool invocation part
    }

    // Check if the tool has a result
    if (part.toolInvocation.state === "result") {
      return false; // Tool has a result, so it's not loading
    }

    // Fallback to the global isLoading state
    return isLoading;
  };

  const isLatestTextPartLoading = (messageIndex: number, partIndex: number) => {
    if (!isLoading) {
      return false;
    }

    if (messages.length === 0) {
      return false;
    }

    const latestMessageIndex = messages.length - 1;
    const latestMessage = messages[latestMessageIndex];

    if (!latestMessage || !latestMessage.parts) {
      return false;
    }

    const latestPartIndex = latestMessage.parts.length - 1;

    return (
      messageIndex === latestMessageIndex &&
      partIndex === latestPartIndex &&
      latestMessage.parts[latestPartIndex].type === "text"
    );
  };

  const isLastTextPart = (message: Message, partIndex: number): boolean => {
    if (!message || !message?.parts) {
      return false;
    }

    const textParts = message.parts.filter((part: any) => part.type === "text");

    if (textParts.length === 0) {
      return false; // No text parts in the message
    }

    // Find the index of the current part in the filtered text parts array
    const textPartIndex = textParts.findIndex((part: any, index: number) => {
      return message?.parts?.indexOf(part) === partIndex;
    });

    if (textPartIndex === -1) {
      return false; // Current part is not a text part
    }

    return textPartIndex === textParts.length - 1;
  };

  const shouldShowLoadingSkeleton = isSubmitted && messages.length > 0;
  const shouldShowSkeletonInsideLastMessage =
    shouldShowLoadingSkeleton && messages[messages.length - 1].role !== "user";

  return (
    <div className="flex flex-col gap-4">
      {messages.map((m, messageIndex) => (
        <ChatMessage
          key={m.id}
          message={m}
          messageIndex={messageIndex}
          isToolLoading={isToolInvocationLoading}
          isTextLoading={isLatestTextPartLoading}
          isLastTextPart={isLastTextPart}
          shouldShowSkeletonInsideLastMessage={
            shouldShowSkeletonInsideLastMessage &&
            messageIndex === messages.length - 1
          }
        />
      ))}
      {shouldShowLoadingSkeleton && !shouldShowSkeletonInsideLastMessage && (
        <Skeleton className="h-10 w-3/4 rounded-md"></Skeleton>
      )}
    </div>
  );
};

export default React.memo(ChatMessagesList);
