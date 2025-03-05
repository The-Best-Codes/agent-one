import { AttachmentsDisplay } from "@/components/a1/chat/attachments-display";
import { ToolRenderer } from "@/components/a1/tool-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const shouldExpand = text.length > 300;

  if (isLastTextPart || !shouldExpand) {
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
          "prose max-w-none dark:prose-invert relative transition-all duration-300",
          expanded
            ? "max-h-fit h-48 overflow-auto"
            : "max-h-24 overflow-hidden",
          isLoading ? "opacity-50" : "opacity-100",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent flex justify-center">
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown />
                <span>Show more</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
