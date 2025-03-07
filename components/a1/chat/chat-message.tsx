import { AttachmentsDisplay } from "@/components/a1/chat/attachments-display";
import { TextPart } from "@/components/a1/chat/cm-text-part";
import { ChatMessageToolbar } from "@/components/a1/chat/cm-toolbar";
import { ToolRenderer } from "@/components/a1/tool-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: any;
  messageIndex: number;
  isToolLoading: (messageIndex: number, partIndex: number) => boolean;
  isTextLoading: (messageIndex: number, partIndex: number) => boolean;
  isLastTextPart: (message: any, partIndex: number) => boolean;
  shouldShowSkeletonInsideLastMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  messageIndex,
  isToolLoading,
  isTextLoading,
  isLastTextPart,
  shouldShowSkeletonInsideLastMessage,
}) => {
  let fullText = "";

  return (
    <div
      className={`flex flex-col w-full ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`rounded-md p-3 max-w-3/4 ${
          message.role === "user" ? "bg-secondary" : "bg-card border"
        } shadow-none motion-preset-blur-up flex flex-col gap-4`}
      >
        {message.parts?.map((part: any, partIndex: number) => {
          if (part.type === "tool-invocation") {
            return (
              <ToolRenderer
                key={`${message.id}-tool-${partIndex}`}
                toolInvocation={part.toolInvocation}
                messageId={message.id}
                partIndex={partIndex}
                isLoading={isToolLoading(messageIndex, partIndex)}
              />
            );
          } else if (part.type === "text") {
            fullText += part.text;
            if (message.role === "user") {
              return (
                <div
                  className="prose dark:prose-invert"
                  key={`${message.id}-text-${partIndex}`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            } else {
              return (
                <TextPart
                  key={`${message.id}-text-${partIndex}`}
                  part={part}
                  isLastTextPart={isLastTextPart(message, partIndex)}
                  isLoading={isTextLoading(messageIndex, partIndex)}
                />
              );
            }
          }
          return null;
        })}

        {message.experimental_attachments &&
          message.experimental_attachments.length > 0 && (
            <AttachmentsDisplay
              attachments={message.experimental_attachments}
            />
          )}
        {shouldShowSkeletonInsideLastMessage && (
          <Skeleton className="h-10 w-full rounded-md"></Skeleton>
        )}
      </div>
      <ChatMessageToolbar text={fullText} />
    </div>
  );
};
