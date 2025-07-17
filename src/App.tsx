import { MessageParts } from "@/components/a1/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatContext } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";
import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const { error, messages, sendMessage } = useChatContext();

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-2 items-center pt-4"
        >
          <Input
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim()}>
            Send
          </Button>
          {error && (
            <div className="text-destructive text-sm mt-2">{error.message}</div>
          )}
        </form>
      </div>
    </main>
  );
}

export default App;
