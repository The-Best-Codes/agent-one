import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useChat } from "@ai-sdk/react";
import { convertToModelMessages, DefaultChatTransport, streamText } from "ai";
import { useState } from "react";

const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY,
});

const customFetch = async (_input: RequestInfo | URL, options: any) => {
  const m = JSON.parse(options.body) as any;
  console.log(m);
  const result = streamText({
    model: google("gemini-2.0-flash"),
    messages: convertToModelMessages(m.messages),
    abortSignal: options.signal,
  });
  return result.toUIMessageStreamResponse();
};

function App() {
  const [input, setInput] = useState("");

  const { error, messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: customFetch,
    }),
  });

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
