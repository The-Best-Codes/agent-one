import { useChat } from "@/hooks/ai/useChat";
import { google } from "@/lib/ai/providers/google";
import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const { error, messages, sendMessage } = useChat(google("gemini-2.0-flash"));

  return (
    <main>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        {error && <div>Error: {error.message}</div>}
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </main>
  );
}

export default App;
