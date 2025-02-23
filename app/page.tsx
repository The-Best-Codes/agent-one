"use client";

import { Browse } from "@/components/tools/browse";
import { Search } from "@/components/tools/search";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      maxSteps: 25,
    });

  const isToolLoading = (messageIndex: number, partIndex: number) => {
    if (!isLoading) {
      return false;
    }

    if (messages.length === 0) {
      return false;
    }

    const latestMessageIndex = messages.length - 1;
    const latestMessage = messages[latestMessageIndex];

    if (!latestMessage || !latestMessage.parts) {
      return false;
    }

    const latestPartIndex = latestMessage.parts.length - 1;

    return messageIndex === latestMessageIndex && partIndex === latestPartIndex;
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m, messageIndex) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.parts?.map((part, partIndex) => {
            if (part.type === "tool-invocation") {
              if (part.toolInvocation.toolName === "searchTool") {
                return (
                  <Search
                    key={`${m.id}-search-${partIndex}`}
                    query={part.toolInvocation.args.query}
                    isLoading={isToolLoading(messageIndex, partIndex)}
                  />
                );
              } else if (part.toolInvocation.toolName === "browseTool") {
                return (
                  <Browse
                    key={`${m.id}-browse-${partIndex}`}
                    url={part.toolInvocation.args.url}
                    isLoading={isToolLoading(messageIndex, partIndex)}
                  />
                );
              }
            } else if (part.type === "text") {
              return <p key={`${m.id}-text-${partIndex}`}>{part.text}</p>;
            }
            return null;
          })}
        </div>
      ))}

      {error && <p className="text-red-500">{error.message}</p>}
      {/* {JSON.stringify(messages)} */}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
