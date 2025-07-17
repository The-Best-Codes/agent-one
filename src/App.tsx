import { useChat } from "@/hooks/ai/useChat";
import { google } from "@/lib/ai/providers/google";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function App() {
  const [input, setInput] = useState("");
  const { error, messages, sendMessage } = useChat(google("gemini-2.0-flash"));

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
              <div
                className={cn("max-w-3/4 p-2 rounded-md", {
                  "bg-secondary text-secondary-foreground":
                    message.role === "user",
                  "bg-primary text-primary-foreground": message.role !== "user",
                })}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <div key={`${message.id}-${i}`}>{part.text}</div>;
                    default:
                      return null;
                  }
                })}
              </div>
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
