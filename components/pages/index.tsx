"use client";

import { EmptyChatState } from "@/components/a1/chat/empty-state";
import { ChatMessagesList } from "@/components/a1/chat/message-list";
import { MainInput } from "@/components/a1/main-input";
import { Loader } from "@/components/a1/smooth-loader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";

export const ChatInterface: React.FC = () => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isSubmitted,
    status,
    error,
    stop,
    reload,
    isLoadingInitial,
  } = useChatContext();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (isLoadingInitial) {
    return (
      <div className="flex flex-row gap-2 w-full items-center justify-center">
        <Loader />
        <p className="text-lg text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full">
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
          {isSubmitted && messages.length === 0 && (
            <Skeleton className="h-10 w-3/4 rounded-md"></Skeleton>
          )}
        </div>

        {status === "error" && (
          <div className="p-4 flex flex-row justify-between items-center w-full bg-destructive border border-destructive text-destructive-foreground rounded-md mb-4">
            <div className="w-full">
              <p className="font-bold">Error:</p>
              <p>{error?.message || "An unknown error occurred."}</p>
            </div>
            <div className="flex-1">
              <Button variant="default" onClick={() => reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <MainInput
          input={input}
          handleInputChange={handleInputChange as any}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </div>
    </div>
  );
};
