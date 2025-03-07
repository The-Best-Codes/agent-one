"use client";

import { EmptyChatState } from "@/components/a1/chat/empty-state";
import { ChatMessagesList } from "@/components/a1/chat/message-list";
import { MainInput } from "@/components/a1/main-input";
import { Skeleton } from "@/components/ui/skeleton";
import { createChat, loadChat } from "@/lib/chat-store";
import { useChat } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");
  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const initializeChat = async () => {
      if (chatIdFromUrl) {
        // Load existing chat
        const loadedMessages = await loadChat(chatIdFromUrl);
        setInitialMessages(loadedMessages);
        setChatId(chatIdFromUrl);
      } else {
        // Create new chat
        const newChatId = await createChat();
        setChatId(newChatId);
        router.push(`/?chatId=${newChatId}`); // Update URL
      }
    };

    initializeChat();
  }, [chatIdFromUrl, router]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
  } = useChat({
    id: chatId || undefined, // Pass chatId to useChat
    initialMessages: initialMessages,
    maxSteps: 50,
    sendExtraMessageFields: true,
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

  if (!chatId) {
    return <div>Loading...</div>; // TODO: Improve loader and handle errors
  }

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
          {isSubmitted && messages.length === 0 && (
            <Skeleton className="h-10 w-3/4 rounded-md"></Skeleton>
          )}
        </div>

        {status === "error" && (
          <div className="p-4 bg-destructive border border-destructive text-destructive-foreground rounded-md mb-4">
            <p className="font-bold">Error:</p>
            <p>{error?.message || "An unknown error occurred."}</p>
          </div>
        )}

        <MainInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </div>
    </div>
  );
}
