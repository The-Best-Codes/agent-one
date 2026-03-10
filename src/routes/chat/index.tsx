import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { AutoScrollContainer, type AutoScrollHandle } from "@/components/a1/auto-scroll-container";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { ChatUsageStatus } from "@/components/a1/chat-usage-status";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { useChatLoading, useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ChatInterface = ({ chatId }: { chatId: string | undefined }) => {
  const messages = useChatMessages();
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<AutoScrollHandle | null>(null);
  const [delayPassed, setDelayPassed] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isChatLoading) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsInitialLoad(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isChatLoading]);

  useEffect(() => {
    if (!isChatLoading) {
      return;
    }
    const timer = setTimeout(() => {
      setDelayPassed(true);
    }, CHAT_LOADING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setDelayPassed(false);
    };
  }, [isChatLoading]);

  const showSpinner = isChatLoading && (isInitialLoad || delayPassed);

  const lastMessageId = messages[messages.length - 1]?.id;
  const initialInputValue = searchParams.get("initialMessage") || undefined;

  return (
    <main className="flex h-svh" role="main" data-testid="main">
      <Sidebar />
      <ChatUsageStatus />

      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center"
        data-testid="chat-main"
      >
        <div className="flex h-full w-full max-w-3xl flex-1 flex-col">
          {isChatLoading && showSpinner ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
            </div>
          ) : (
            <AutoScrollContainer
              ref={scrollRef}
              className="max-h-full min-h-0 flex-1 pr-0 pb-2 md:pr-2"
              scrollableClassName="pr-2 pt-2 h-full"
              behavior="instant"
              buttonScrollBehavior={status === "streaming" ? "instant" : "smooth"}
            >
              {messages.length === 0 && <NoMessagesGreeting />}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "mb-1 justify-start last:mb-0",
                  )}
                >
                  <MessageParts message={message} isLastMessage={message.id === lastMessageId} />
                </div>
              ))}
              {messages.length > 0 && <ChatMessageLoading mode="inLayout" />}
            </AutoScrollContainer>
          )}
          <MainChatInput
            key={chatId || "new-chat"}
            initialValue={initialInputValue}
            disabled={isChatLoading}
            onScrollNeededAction={() => {
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
