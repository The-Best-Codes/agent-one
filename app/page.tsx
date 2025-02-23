"use client";

import { Browse } from "@/components/tools/browse";
import { Search } from "@/components/tools/search";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      maxSteps: 5,
    });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.parts[0].type === "tool-invocation" ? (
            <>
              {m.parts[0].toolInvocation.toolName === "searchTool" && (
                <Search
                  query={m.parts[0].toolInvocation.args.query}
                  isLoading={isLoading}
                />
              )}
              {m.parts[0].toolInvocation.toolName === "browseTool" && (
                <Browse
                  url={m.parts[0].toolInvocation.args.url}
                  isLoading={isLoading}
                />
              )}
              {/* <pre>{JSON.stringify(m.parts[0].toolInvocation, null, 2)}</pre> */}
            </>
          ) : (
            <p>{m.content}</p>
          )}
        </div>
      ))}

      {error && <p className="text-red-500">{error.message}</p>}

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
