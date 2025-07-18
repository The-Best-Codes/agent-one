import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { useChatMessages } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";

function App() {
  const { messages } = useChatMessages();

  return (
    <main className="h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl h-full flex-1 flex flex-col">
        <div className="flex-1 max-h-full overflow-auto space-y-4 p-2 pb-0 pl-0 mb-2">
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
