import {
  AutoScrollContainer,
  type AutoScrollHandle,
} from "@/components/a1/auto-scroll-container";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { useChatMessages } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";
import { useRef } from "react";

function HomeRoute() {
  const messages = useChatMessages();
  const scrollRef = useRef<AutoScrollHandle | null>(null);

  return (
    <div className="h-screen flex" data-testid="home-main">
      <Sidebar />

      <main
        className="flex-1 flex flex-col items-center justify-center"
        role="main"
      >
        <div className="w-full max-w-3xl h-full flex-1 flex flex-col">
          <AutoScrollContainer
            ref={scrollRef}
            className="flex-1 max-h-full mb-2 min-h-0"
            scrollableClassName="p-2 pl-0 h-full"
            behavior="smooth"
          >
            {messages.length === 0 && <NoMessagesGreeting />}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex mb-4 last:mb-0",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <MessageParts message={message} />
              </div>
            ))}
            {messages.length > 0 && <ChatMessageLoading mode="inLayout" />}
          </AutoScrollContainer>
          <MainChatInput
            onAfterSend={() => {
              scrollRef.current?.scrollToBottom();
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default HomeRoute;
