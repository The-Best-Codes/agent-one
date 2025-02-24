"use client";

import { Browse } from "@/components/tools/browse";
import { ImageDesc } from "@/components/tools/imageDesc";
import { QueryPage } from "@/components/tools/queryPage";
import { Search } from "@/components/tools/search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      maxSteps: 25,
    });

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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
                className={m.role === "user" ? "bg-zinc-50" : ""}
              >
                <CardHeader>
                  <CardTitle>{m.role === "user" ? "User" : "AI"}</CardTitle>
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
                      }
                    } else if (part.type === "text") {
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
