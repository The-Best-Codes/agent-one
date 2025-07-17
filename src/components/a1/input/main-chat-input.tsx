import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatContext } from "@/contexts/chat-context";
import { useState } from "react";

export const MainChatInput = () => {
  const [input, setInput] = useState("");
  const { sendMessage, error } = useChatContext();

  return (
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
  );
};
