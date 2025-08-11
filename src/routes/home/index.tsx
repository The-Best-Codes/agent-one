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
import { createChat, loadChat, cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";

// The UI part of the chat, which consumes the ChatContext
const ChatInterface = () => {
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
};

// The route component that handles logic for loading/creating chats
function HomeRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Handle redirection for new chats
  useEffect(() => {
    if (!id) {
      const newChatId = createChat();
      navigate(`/chat/${newChatId}`, { replace: true });
    }
  }, [id, navigate]);

  // Load initial messages for the current chat
  const initialMessages = useMemo(() => {
    if (id) {
      return loadChat(id);
    }
    return [];
  }, [id]);

  // Render nothing until we have an ID and have redirected
  if (!id) {
    return null; // Or a loading spinner
  }

  return (
    <ChatProvider chatId={id} initialMessages={initialMessages}>
      <ChatInterface />
    </ChatProvider>
  );
}

export default HomeRoute;
