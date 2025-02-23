"use client";

import { Browse } from "@/components/tools/browse";
import { Search } from "@/components/tools/search";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      maxSteps: 5,
    });

  const isToolLoading = (part: any) => {
    return isLoading && part.type === "tool-invocation";
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.parts?.map((part, index) => {
            if (part.type === "tool-invocation") {
              if (part.toolInvocation.toolName === "searchTool") {
                return (
                  <Search
                    key={`${m.id}-search-${index}`}
                    query={part.toolInvocation.args.query}
                    isLoading={isToolLoading(part)}
                  />
                );
              } else if (part.toolInvocation.toolName === "browseTool") {
                return (
                  <Browse
                    key={`${m.id}-browse-${index}`}
                    url={part.toolInvocation.args.url}
                    isLoading={isToolLoading(part)}
                  />
                );
              }
            } else if (part.type === "text") {
              return <p key={`${m.id}-text-${index}`}>{part.text}</p>;
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
