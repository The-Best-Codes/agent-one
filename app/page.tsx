"use client";

import { EmptyChatState } from "@/components/a1/chat/empty-state";
import { ChatMessagesList } from "@/components/a1/chat/message-list";
import { MainInput } from "@/components/a1/main-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
  } = useChat({
    maxSteps: 50,
  });

  const isLoading = status !== "ready";
  const isSubmitted = status === "submitted";

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex w-full max-w-3xl mx-auto py-12 h-screen">
      <div className="flex flex-col w-full">
        <div className="flex-1 mb-4 pr-2 overflow-auto" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <EmptyChatState />
          ) : (
            <ChatMessagesList
              messages={messages}
              isLoading={isLoading}
              isSubmitted={isSubmitted}
            />
          )}
          {status === "error" && (
            <p className="text-red-500">{error?.message}</p>
          )}
          {isSubmitted && messages.length === 0 && (
            <Skeleton className="h-10 w-3/4 rounded-md"></Skeleton>
          )}
        </div>

        <MainInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
        />
      </div>
    </div>
  );
}
