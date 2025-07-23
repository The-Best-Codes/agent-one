import { AutoScrollContainer } from "@/components/a1/auto-scroll-container";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { useChatMessages } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";

function HomeRoute() {
  const { messages } = useChatMessages();

  return (
    <main className="h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl h-full flex-1 flex flex-col">
        <AutoScrollContainer
          className="flex-1 max-h-full my-2 min-h-0"
          scrollableClassName="space-y-0 p-0 pr-2"
          smoothScroll={true}
        >
          {messages.length === 0 && <NoMessagesGreeting />}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <MessageParts message={message} />
            </div>
          ))}
        </AutoScrollContainer>
        <MainChatInput />
      </div>
    </main>
  );
}

export default HomeRoute;
