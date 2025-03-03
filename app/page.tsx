"use client";

import { MainInput } from "@/components/a1/main-input";
import { ToolRenderer } from "@/components/a1/tool-renderer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "@ai-sdk/react";
import { FileText, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
  } = useChat({
    maxSteps: 50,
  });

  const [thinkStartTime, setThinkStartTime] = useState<Record<string, number>>(
    {},
  );
  const [thinkDurations, setThinkDurations] = useState<Record<string, number>>(
    {},
  );
  const [outputSummary, setOutputSummary] = useState<string | null>(null);

  const getPartId = (messageId: string, partIndex: number) =>
    `${messageId}-${partIndex}`;

  const isToolLoading = (messageIndex: number, partIndex: number) => {
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

  const isTextLoading = (messageIndex: number, partIndex: number) => {
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const outputSummaryRef = useRef<HTMLDivElement>(null);
  const [isOutputSummaryFocused, setIsOutputSummaryFocused] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    messages.forEach((message, messageIndex) => {
      message.parts?.forEach((part, partIndex) => {
        const partId = getPartId(message.id, partIndex);

        // Start timing if this is the current part being processed
        if (isTextLoading(messageIndex, partIndex)) {
          if (!thinkStartTime[partId]) {
            setThinkStartTime((prev) => ({
              ...prev,
              [partId]: Date.now(),
            }));
          }
        } // Complete timing when the next part starts or message completes
        else if (thinkStartTime[partId] && !thinkDurations[partId]) {
          const duration = (Date.now() - thinkStartTime[partId]) / 1000;
          setThinkDurations((prev) => ({
            ...prev,
            [partId]: duration,
          }));
        }
      });
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      // Find the latest assistant message
      const latestAssistantMessage = messages
        .slice()
        .reverse()
        .find((message) => message.role === "assistant");

      if (latestAssistantMessage && latestAssistantMessage.parts) {
        // Find the latest text part in the latest assistant message
        const latestTextPart = latestAssistantMessage.parts
          .slice()
          .reverse()
          .find((part) => part.type === "text");

        if (latestTextPart) {
          setOutputSummary(latestTextPart.text);
          focusOutputSummary();
        } else {
          setOutputSummary(null);
        }
      } else {
        setOutputSummary(null);
      }
    }
  }, [isLoading, messages]);

  const getThinkingText = (
    messageId: string,
    partIndex: number,
    messageIndex: number,
  ) => {
    const partId = getPartId(messageId, partIndex);

    if (isTextLoading(messageIndex, partIndex)) {
      return "Thinking...";
    }

    const duration = thinkDurations[partId];
    if (!duration) return "Thinking...";

    if (duration < 1) return "Thought briefly";
    if (duration < 2) return "Thought for a second";
    return `Thought for ${Math.round(duration)} seconds`;
  };

  const isLastTextPart = (message: any, partIndex: number): boolean => {
    if (!message || !message.parts) {
      return false; // Or handle this case as needed
    }

    const textParts = message.parts.filter((part: any) => part.type === "text");

    if (textParts.length === 0) {
      return false; // No text parts in the message
    }

    // Find the index of the current part in the filtered text parts array
    const textPartIndex = textParts.findIndex((part: any, index: number) => {
      return message.parts.indexOf(part) === partIndex;
    });

    if (textPartIndex === -1) {
      return false; // Current part is not a text part
    }

    return textPartIndex === textParts.length - 1;
  };

  const focusOutputSummary = () => {
    if (outputSummaryRef.current) {
      outputSummaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      outputSummaryRef.current.focus();

      setIsOutputSummaryFocused(true);
      setTimeout(() => {
        setIsOutputSummaryFocused(false);
      }, 300);
    }
  };

  return (
    <div className="flex w-full max-w-6xl py-12 mx-auto h-screen">
      {/* Left Section - Chat Messages */}
      <div className="flex flex-col pr-4 border-r w-1/2">
        <div className="flex-1 mb-4 pr-2 overflow-auto" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-4xl font-bold text-foreground">AgentOne</h2>
              <p className="text-muted-foreground mt-2">
                Enter research instructions below to begin!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m, messageIndex) => (
                <Card
                  key={m.id}
                  className={`${
                    m.role === "user" ? "bg-secondary" : ""
                  } shadow-none motion-preset-blur-up`}
                >
                  <CardHeader>
                    <CardTitle>
                      {m.role === "user" ? "You" : "AgentOne"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    key={`${m.id}-card-content`}
                    className="whitespace-pre-wrap"
                  >
                    {m.parts?.map((part, partIndex) => {
                      if (part.type === "tool-invocation") {
                        return (
                          <ToolRenderer
                            key={`${m.id}-tool-${partIndex}`}
                            toolInvocation={part.toolInvocation}
                            messageId={m.id}
                            partIndex={partIndex}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      } else if (part.type === "text") {
                        if (m.role === "user") {
                          return (
                            <div
                              className="prose dark:prose-invert"
                              key={`${m.id}-text-${partIndex}`}
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
                              className="my-4 motion-preset-blur-right"
                              key={`${m.id}-text-${partIndex}`}
                              value={
                                isLastTextPart(m, partIndex) ? m.id : undefined
                              }
                            >
                              <AccordionItem
                                className="border rounded-xl px-2"
                                value={m.id}
                              >
                                <AccordionTrigger className="text-base py-2">
                                  {isTextLoading(messageIndex, partIndex)
                                    ? "Thinking..."
                                    : getThinkingText(
                                        m.id,
                                        partIndex,
                                        messageIndex,
                                      )}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="prose dark:prose-invert">
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
                      return null;
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {error && <p className="text-red-500">{error.message}</p>}
        </div>

        <MainInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
        />
      </div>

      {/* Right Section - Output Markdown Summary */}
      <div ref={outputSummaryRef} className="w-1/2">
        <Card className="h-full shadow-none border-0 max-h-full overflow-auto">
          <CardHeader className="p-0">
            <CardTitle className="sr-only">Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-full pt-4">
            {outputSummary ? (
              <div
                className={`prose dark:prose-invert motion-duration-300 ${
                  isOutputSummaryFocused ? "motion-preset-blur-up" : ""
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outputSummary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mt-2 text-center">
                  AgentOne's final responses will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
