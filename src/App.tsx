import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { useChatContext } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";

function App() {
  const { messages } = useChatContext();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", {
                "justify-end": message.role === "user",
                "justify-start": message.role !== "user",
              })}
            >
              <MessageParts message={message} />
            </div>
          ))}
        </div>
        <MainChatInput />
      </div>
    </main>
  );
}

export default App;
