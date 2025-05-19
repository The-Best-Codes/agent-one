"use client";

import { Loader } from "@/components/a1/smooth-loader";
import { ChatInterface } from "@/components/pages/index";
import { Sidebar } from "@/components/pages/sidebar";
import { getChatName, setChatName } from "@/lib/chat-name-store";
import { createChat, loadChat } from "@/lib/chat-store";
import generateTitle from "@/utils/chat/titleGen";
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

  const [refreshChatNames, setRefreshChatNames] = useState(false);
  const forceSidebarUpdate = () => {
    setRefreshChatNames((prev) => !prev); // Toggle state to trigger useEffect in Sidebar
  };

  const initializeChat = async (chatIdProp?: string | null, type?: string) => {
    setIsLoadingInitial(true);
    try {
      console.log("Initializing chat with props:", {
        chatIdProp,
        type,
        chatIdFromUrl,
      });
      let chatIdToUse = chatIdProp || chatIdFromUrl;

      if (type === "new") {
        chatIdToUse = null;
      }

      if (!chatIdToUse) {
        console.log("Creating new chat...");
        const newChatId = await createChat();
        console.log("New chat created with ID:", newChatId);
        chatIdToUse = newChatId;
        router.push(`/?chatId=${newChatId}`);
      } else {
        console.log("Using existing chat ID:", chatIdToUse);
        router.push(`/?chatId=${chatIdToUse}`);
      }

      console.log("Loading messages for chat:", chatIdToUse);
      let loadedMessages = await loadChat(chatIdToUse);
      console.log("Loaded messages count:", loadedMessages.length);

      console.log("Getting chat name for:", chatIdToUse);
      let chatName = await getChatName(chatIdToUse);
      console.log("Retrieved chat name:", chatName);

      if (!chatName) {
        if (loadedMessages.length > 0) {
          console.log("Generating title from first message");
          try {
            chatName = await generateTitle(loadedMessages[0].content);
            console.log("Generated title:", chatName);
            await setChatName(chatIdToUse, chatName);
            forceSidebarUpdate();
          } catch (titleError) {
            console.error("Error generating title:", titleError);
            chatName = "New Chat";
            await setChatName(chatIdToUse, chatName);
          }
        } else {
          console.log("No messages, using default chat name");
          chatName = "New Chat";
        }
      }

      setInitialMessages(loadedMessages);
      setChatId(chatIdToUse);
      console.log("Chat initialization complete");
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

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
      <Sidebar
        currentChatId={chatId}
        handleChatIdChange={initializeChat}
        refreshChatNames={refreshChatNames}
      />
      <div className="flex w-full max-w-4xl mx-auto p-4 h-full">
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
          <div className="flex flex-row gap-2 w-full h-full items-center justify-center text-lg">
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
