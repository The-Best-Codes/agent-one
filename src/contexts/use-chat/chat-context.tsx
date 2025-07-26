import { useChat } from "@/hooks/ai/useChat";
import { google } from "@/lib/ai/providers/google";
import type { LanguageModel } from "ai";
import React, { useMemo, useRef, type ReactNode } from "react";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useStableObject<T extends Record<string, any>>(obj: T): T {
  const ref = useRef<T>(obj);
  const keysRef = useRef<string[]>(Object.keys(obj));

  const hasChanged = useMemo(() => {
    const currentKeys = Object.keys(obj);

    if (
      currentKeys.length !== keysRef.current.length ||
      !currentKeys.every((key) => keysRef.current.includes(key))
    ) {
      keysRef.current = currentKeys;
      return true;
    }

    return currentKeys.some((key) => ref.current[key] !== obj[key]);
  }, [obj]);

  if (hasChanged) {
    ref.current = obj;
  }

  return ref.current;
}

interface ChatProviderProps {
  children: ReactNode;
  model?: LanguageModel;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  model = google("gemini-2.5-flash"),
}) => {
  const chatResult = useChat(model, {
    experimental_throttle: 250, // TODO: Allow customizing this in settings
    maxSteps: 50,
  });

  const messagesValue = useStableObject({
    messages: chatResult.messages,
  });

  const statusValue = useStableObject({
    status: chatResult.status,
    error: chatResult.error,
  });

  const functionsValue = useStableObject({
    sendMessage: chatResult.sendMessage,
    addToolResult: chatResult.addToolResult,
    regenerate: chatResult.regenerate,
    resumeStream: chatResult.resumeStream,
    stop: chatResult.stop,
  });

  return (
    <ChatMessagesContext.Provider value={messagesValue}>
      <ChatStatusContext.Provider value={statusValue}>
        <ChatFunctionsContext.Provider value={functionsValue}>
          {children}
        </ChatFunctionsContext.Provider>
      </ChatStatusContext.Provider>
    </ChatMessagesContext.Provider>
  );
};
