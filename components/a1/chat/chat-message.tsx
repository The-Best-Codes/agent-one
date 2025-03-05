import { AttachmentsDisplay } from "@/components/a1/chat/attachments-display";
import { ToolRenderer } from "@/components/a1/tool-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: any;
  messageIndex: number;
  isToolLoading: (messageIndex: number, partIndex: number) => boolean;
  isTextLoading: (messageIndex: number, partIndex: number) => boolean;
  isLastTextPart: (message: any, partIndex: number) => boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  messageIndex,
  isToolLoading,
  isTextLoading,
  isLastTextPart,
}) => {
  return (
    <div
      className={`flex flex-col w-full ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`rounded-xl p-3 max-w-3/4 ${
          message.role === "user" ? "bg-secondary text-right" : "bg-card border"
        } shadow-md motion-preset-blur-up space-y-4`}
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
      </div>
    </div>
  );
};

interface TextPartProps {
  part: any;
  isLastTextPart: boolean;
  isLoading: boolean;
}

const TextPart: React.FC<TextPartProps> = ({
  part,
  isLastTextPart,
  isLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const text = part.text;
  const shouldExpand = text.length > 255;
  const truncatedText =
    shouldExpand && !expanded ? text.substring(0, 255) : text;

  if (isLastTextPart) {
    return (
      <div className="prose max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "prose max-w-none dark:prose-invert overflow-hidden transition-all duration-300",
          shouldExpand && !expanded ? "line-clamp-[12]" : "",
          isLoading ? "opacity-50" : "opacity-100",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {truncatedText}
        </ReactMarkdown>
        {shouldExpand && !expanded && (
          <span className="text-gray-500 dark:text-gray-400">...</span>
        )}
      </div>
      {shouldExpand && (
        <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      )}
    </div>
  );
};
