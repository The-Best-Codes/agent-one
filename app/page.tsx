"use client";

import { Loader } from "@/components/a1/smooth-loader";
import { ChatInterface } from "@/components/pages/index";
import { Sidebar } from "@/components/pages/sidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { Suspense } from "react";

function Chat() {
  const {
    chatId,
    initializeChat,
  } = useChatContext();

  return (
    <>
      <Sidebar />
      <div className="flex w-full max-w-4xl mx-auto p-4 h-full">
        <ChatInterface />
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
