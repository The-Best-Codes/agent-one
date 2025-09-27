import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { useParams } from "react-router";

import {
  AutoScrollContainer,
  type AutoScrollHandle,
} from "@/components/a1/auto-scroll-container";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";

const ChatInterface = ({ chatId }: { chatId: string | undefined }) => {
  const messages = useChatMessages();
  const { status } = useChatStatus();
  const scrollRef = useRef<AutoScrollHandle | null>(null);

  return (
    <main className="flex h-svh" role="main" data-testid="main">
      <Sidebar />

      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center"
        data-testid="chat-main"
      >
        <div className="flex h-full w-full max-w-3xl flex-1 flex-col">
          <AutoScrollContainer
            ref={scrollRef}
            className="max-h-full min-h-0 flex-1 p-2 pr-0 pl-0 md:pr-2"
            scrollableClassName="pr-2 h-full"
            scrollButtonClassName="mr-2"
            behavior="instant"
            buttonScrollBehavior={status === "streaming" ? "instant" : "smooth"}
          >
            {chatId && messages.length === 0 && status === "ready" ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading chat...</span>
              </div>
            ) : messages.length === 0 ? (
              <NoMessagesGreeting />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <MessageParts message={message} />
                </div>
              ))
            )}
            {messages.length > 0 && <ChatMessageLoading mode="inLayout" />}
          </AutoScrollContainer>
          <MainChatInput
            key={chatId || "new-chat"}
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

  return (
    <MultiChatProvider currentChatId={id}>
      <ChatInterface chatId={id} />
    </MultiChatProvider>
  );
}

export default ChatRoute;
