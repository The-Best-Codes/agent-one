import { useRef } from "react";
import { useParams, useSearchParams } from "react-router";

import {
  AutoScrollContainer,
  type AutoScrollHandle,
} from "@/components/a1/auto-scroll-container";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";

const ChatInterface = ({ chatId }: { chatId: string | undefined }) => {
  const messages = useChatMessages();
  const { status } = useChatStatus();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<AutoScrollHandle | null>(null);

  const initialInputValue = searchParams.get("initialMessage") || undefined;

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
            className="max-h-full min-h-0 flex-1 pr-0 pb-2 md:pr-2"
            scrollableClassName="pr-2 pt-2 h-full"
            scrollButtonClassName="mr-2"
            behavior="instant"
            buttonScrollBehavior={status === "streaming" ? "instant" : "smooth"}
          >
            {messages.length === 0 && <NoMessagesGreeting />}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user"
                    ? "justify-end"
                    : "mb-1 justify-start last:mb-0",
                )}
              >
                <MessageParts message={message} />
              </div>
            ))}
            {messages.length > 0 && <ChatMessageLoading mode="inLayout" />}
          </AutoScrollContainer>
          <MainChatInput
            key={chatId || "new-chat"}
            initialValue={initialInputValue}
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

  return <ChatInterface chatId={id} />;
}

export default ChatRoute;
