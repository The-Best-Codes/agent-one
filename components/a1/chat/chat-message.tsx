import { ToolRenderer } from "@/components/a1/tool-renderer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: any;
  messageIndex: number;
  isToolLoading: (messageIndex: number, partIndex: number) => boolean;
  isTextLoading: (messageIndex: number, partIndex: number) => boolean;
  getThinkingText: (
    messageId: string,
    partIndex: number,
    messageIndex: number,
  ) => string;
  isLastTextPart: (message: any, partIndex: number) => boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  messageIndex,
  isToolLoading,
  isTextLoading,
  getThinkingText,
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
              if (isLastTextPart(message, partIndex)) {
                return (
                  <div
                    className="prose max-w-none dark:prose-invert"
                    key={`${message.id}-text-${partIndex}`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {part.text}
                    </ReactMarkdown>
                  </div>
                );
              } else {
                return (
                  <Accordion
                    type="single"
                    collapsible
                    className="motion-preset-blur-right"
                    key={`${message.id}-text-${partIndex}`}
                  >
                    <AccordionItem
                      className="border rounded-xl px-2"
                      value={message.id}
                    >
                      <AccordionTrigger className="text-base py-2">
                        {isTextLoading(messageIndex, partIndex)
                          ? "Thinking..."
                          : getThinkingText(
                              message.id,
                              partIndex,
                              messageIndex,
                            )}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              }
            }
          }
          return null;
        })}
      </div>
    </div>
  );
};
