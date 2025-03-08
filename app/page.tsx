"use client";

import { Loader } from "@/components/a1/smooth-loader";
import { ChatInterface } from "@/components/pages/index";
import { Sidebar } from "@/components/pages/sidebar";
import { createChat, loadChat } from "@/lib/chat-store";
import { useChat } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Chat() {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");
  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoadingInitial(true);
      try {
        if (chatIdFromUrl) {
          const loadedMessages = await loadChat(chatIdFromUrl);
          setInitialMessages(loadedMessages);
          setChatId(chatIdFromUrl);
        } else {
          const newChatId = await createChat();
          setChatId(newChatId);
          router.push(`/?chatId=${newChatId}`);
        }
      } finally {
        setIsLoadingInitial(false);
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
    reload,
  } = useChat({
    id: chatId || undefined,
    initialMessages: initialMessages,
    maxSteps: 50,
    sendExtraMessageFields: true,
  });

  const isLoading = status !== "ready";
  const isSubmitted = status === "submitted";

  return (
    <>
      <Sidebar currentChatId={chatId} />
      <div className="flex w-full max-w-3xl mx-auto py-12 h-full">
        <ChatInterface
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit as any}
          isLoading={isLoading}
          isSubmitted={isSubmitted}
          status={status}
          error={error}
          stop={stop}
          reload={reload}
          isLoadingInitial={isLoadingInitial}
        />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <main className="flex flex-row w-full h-screen">
      <Suspense
        fallback={
          <div className="flex flex-row w-full h-full items-center justify-center text-lg">
            <Loader />
            <span>Loading AgentOne...</span>
          </div>
        }
      >
        <Chat />
      </Suspense>
    </main>
  );
}
