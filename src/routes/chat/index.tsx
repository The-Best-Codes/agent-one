import {
  AutoScrollContainer,
  type AutoScrollHandle,
} from "@/components/a1/auto-scroll-container";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { ChatProvider } from "@/contexts/use-chat/chat-context";
import { useChatMessages } from "@/contexts/use-chat/chat-hooks";
import { loadChat } from "@/lib/ai/persistence";
import { cn } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { useParams } from "react-router";

const ChatInterface = () => {
  const messages = useChatMessages();
  const scrollRef = useRef<AutoScrollHandle | null>(null);

  return (
    <main className="h-screen flex" role="main" data-testid="main">
      <Sidebar />

      <div
        className="flex-1 flex flex-col items-center justify-center"
        data-testid="chat-main"
      >
        <div className="w-full max-w-3xl h-full flex-1 flex flex-col">
          <AutoScrollContainer
            ref={scrollRef}
            className="flex-1 max-h-full mb-2 min-h-0 p-2 pl-0"
            scrollableClassName="pr-2 h-full"
            scrollButtonClassName="mr-2"
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
      </div>
    </main>
  );
};

function ChatRoute() {
  const { id } = useParams<{ id: string }>();

  const initialMessages = useMemo(() => {
    if (id) {
      return loadChat(id);
    }
    return [];
  }, [id]);

  return (
    <ChatProvider chatId={id} initialMessages={initialMessages}>
      <ChatInterface />
    </ChatProvider>
  );
}

export default ChatRoute;
