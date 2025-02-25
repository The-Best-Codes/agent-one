"use client";

import { Browse } from "@/components/tools/browse";
import { ImageDesc } from "@/components/tools/imageDesc";
import { QueryPage } from "@/components/tools/queryPage";
import { RegexPage } from "@/components/tools/regexPage";
import { Search } from "@/components/tools/search";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      maxSteps: 50,
    });
  const [thinkStartTime, setThinkStartTime] = useState<Record<string, number>>(
    {},
  );
  const [thinkDurations, setThinkDurations] = useState<Record<string, number>>(
    {},
  );

  const getPartId = (messageId: string, partIndex: number) =>
    `${messageId}-${partIndex}`;

  const isToolLoading = (messageIndex: number, partIndex: number) => {
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

    return messageIndex === latestMessageIndex && partIndex === latestPartIndex;
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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
        }

        // Complete timing when the next part starts or message completes
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

  return (
    <div className="flex flex-col w-full max-w-2xl py-12 mx-auto h-screen">
      <div
        className="flex-1 mb-4 overflow-y-auto scroll-smooth"
        ref={scrollAreaRef}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-16 h-16 text-zinc-400 mb-4" />
            <h2 className="text-4xl font-bold text-zinc-700">AgentOne</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Send a message to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, messageIndex) => (
              <Card
                key={m.id}
                className={`${m.role === "user" ? "bg-zinc-50" : ""} shadow-none`}
              >
                <CardHeader>
                  <CardTitle>
                    {m.role === "user" ? "User" : "AgentOne"}
                  </CardTitle>
                </CardHeader>
                <CardContent
                  key={`${m.id}-card-content`}
                  className="whitespace-pre-wrap"
                >
                  {m.parts?.map((part, partIndex) => {
                    if (part.type === "tool-invocation") {
                      if (part.toolInvocation.toolName === "searchTool") {
                        return (
                          <Search
                            key={`${m.id}-search-${partIndex}`}
                            query={part.toolInvocation.args.query}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      } else if (
                        part.toolInvocation.toolName === "browseTool"
                      ) {
                        return (
                          <Browse
                            key={`${m.id}-browse-${partIndex}`}
                            url={part.toolInvocation.args.url}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      } else if (
                        part.toolInvocation.toolName === "queryPageTool"
                      ) {
                        return (
                          <QueryPage
                            key={`${m.id}-queryPage-${partIndex}`}
                            url={part.toolInvocation.args.url}
                            selector={part.toolInvocation.args.selector}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      } else if (
                        part.toolInvocation.toolName === "imageDescTool"
                      ) {
                        return (
                          <ImageDesc
                            key={`${m.id}-imageDesc-${partIndex}`}
                            url={part.toolInvocation.args.url}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      } else if (
                        part.toolInvocation.toolName === "regexPageTool"
                      ) {
                        return (
                          <RegexPage
                            key={`${m.id}-regexPage-${partIndex}`}
                            url={part.toolInvocation.args.url}
                            regex={part.toolInvocation.args.regex}
                            isLoading={isToolLoading(messageIndex, partIndex)}
                          />
                        );
                      }
                    } else if (part.type === "text") {
                      if (m.role === "user") {
                        return (
                          <div
                            className="prose"
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
                            key={`${m.id}-text-${partIndex}`}
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
                                <div className="prose">
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
      </div>

      {error && <p className="text-red-500">{error.message}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          className="dark:bg-zinc-900 dark:border-zinc-800"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Researching...
            </>
          ) : (
            "Send"
          )}
        </Button>
      </form>
    </div>
  );
}
