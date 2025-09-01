import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import React, {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";

import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import {
  getDefaultModel,
  getModelById,
  type ModelConfig,
} from "@/lib/ai/models";
import {
  createChat,
  loadChat,
  loadChatData,
  saveChat,
  saveChatModel,
  saveChatTitle,
  saveChatTitleState,
} from "@/lib/ai/persistence";
import { streamRegistry } from "@/lib/ai/stream-registry";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";

import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatModelContext,
  ChatStatusContext,
} from "./chat-contexts";

const logger = getLogger(import.meta.url);

interface ChatProviderProps {
  children: ReactNode;
  chatId: string | undefined;
}

const ChatController = memo(
  ({
    chatId,
    model,
    onUpdate,
    onUnmount,
  }: {
    chatId: string;
    model: LanguageModel;
    onUpdate: (id: string, helpers: UseChatHelpers<UIMessage>) => void;
    onUnmount: (id: string) => void;
  }) => {
    const initialMessages = useMemo(() => {
      try {
        return loadChat(chatId);
      } catch (error) {
        logger.error("Failed to load chat:", chatId, error);
        return [];
      }
    }, [chatId]);

    const chatHelpers = useChat(model, {
      experimental_throttle: 250,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      id: chatId,
      messages: initialMessages,
    });

    useEffect(() => {
      streamRegistry.register(chatId, chatHelpers.stop);
      return () => {
        streamRegistry.unregister(chatId);
        onUnmount(chatId);
      };
    }, [chatId, chatHelpers.stop, onUnmount]);

    useEffect(() => {
      onUpdate(chatId, chatHelpers);
    }, [chatId, onUpdate, chatHelpers]);

    useEffect(() => {
      if (
        chatHelpers.status !== "streaming" &&
        chatHelpers.messages.length > 0
      ) {
        try {
          saveChat({ chatId, messages: chatHelpers.messages });

          const chatData = loadChatData(chatId);
          const hasUserMessage = chatHelpers.messages.some(
            (m) => m.role === "user",
          );

          if (hasUserMessage && !chatData.titleState) {
            saveChatTitleState({ chatId, titleState: "generating" });
            generateChatTitle(model, chatHelpers.messages)
              .then((generatedTitle) => {
                saveChatTitle({ chatId, title: generatedTitle });
              })
              .catch((error) => {
                logger.error(
                  "Failed to generate title for chat:",
                  chatId,
                  error,
                );
                saveChatTitleState({ chatId, titleState: "error" });
              });
          }
        } catch (error) {
          logger.error("Failed to save chat or generate title:", chatId, error);
        }
      }
    }, [chatId, chatHelpers.messages, chatHelpers.status, model]);

    return null;
  },
);
ChatController.displayName = "ChatController";

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
}) => {
  const { currentModel: globalDefaultModel, setModel: setGlobalDefaultModel } =
    useModel();
  const navigate = useNavigate();
  const location = useLocation();

  const chatHelpersMapRef = useRef<Map<string, UseChatHelpers<UIMessage>>>(
    new Map(),
  );
  const [messagesMap, setMessagesMap] = useState<Map<string, UIMessage[]>>(
    new Map(),
  );
  const [statusMap, setStatusMap] = useState<
    Map<string, UseChatHelpers<UIMessage>["status"]>
  >(new Map());
  const [errorMap, setErrorMap] = useState<Map<string, Error | undefined>>(
    new Map(),
  );
  const [chatModelsMap, setChatModelsMap] = useState<Map<string, ModelConfig>>(
    new Map(),
  );

  const loadedChatIds = useMemo(() => {
    const streamingChatIds = Array.from(statusMap.entries())
      .filter(([, status]) => status === "streaming" || status === "submitted")
      .map(([id]) => id);

    const ids = new Set(streamingChatIds);
    if (chatId) {
      ids.add(chatId);
    }
    return ids;
  }, [chatId, statusMap]);

  const prevLoadedChatIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const unloadedIds = [...prevLoadedChatIdsRef.current].filter(
      (id) => !loadedChatIds.has(id),
    );
    if (unloadedIds.length > 0) {
      setMessagesMap((prev) => {
        const next = new Map(prev);
        unloadedIds.forEach((id) => next.delete(id));
        return next;
      });
      setStatusMap((prev) => {
        const next = new Map(prev);
        unloadedIds.forEach((id) => next.delete(id));
        return next;
      });
      setErrorMap((prev) => {
        const next = new Map(prev);
        unloadedIds.forEach((id) => next.delete(id));
        return next;
      });
      setChatModelsMap((prev) => {
        const next = new Map(prev);
        unloadedIds.forEach((id) => next.delete(id));
        return next;
      });
    }
    prevLoadedChatIdsRef.current = loadedChatIds;
  }, [loadedChatIds]);

  useEffect(() => {
    const modelsToLoad = new Map<string, ModelConfig>();
    for (const id of loadedChatIds) {
      if (!chatModelsMap.has(id)) {
        const savedData = loadChatData(id);
        const model = getModelById(savedData.modelId) || getDefaultModel();
        modelsToLoad.set(id, model);
      }
    }
    if (modelsToLoad.size > 0) {
      setChatModelsMap((prev) => new Map([...prev, ...modelsToLoad]));
    }
  }, [loadedChatIds, chatModelsMap]);

  const activeModel = useMemo(() => {
    if (!chatId) return globalDefaultModel;
    return chatModelsMap.get(chatId) || globalDefaultModel;
  }, [chatId, chatModelsMap, globalDefaultModel]);

  const handleControllerUpdate = useCallback(
    (id: string, helpers: UseChatHelpers<UIMessage>) => {
      const currentHelpers = chatHelpersMapRef.current.get(id);
      chatHelpersMapRef.current.set(id, helpers);

      if (currentHelpers?.messages !== helpers.messages) {
        setMessagesMap((prev) => new Map(prev).set(id, helpers.messages));
      }
      if (currentHelpers?.status !== helpers.status) {
        setStatusMap((prev) => new Map(prev).set(id, helpers.status));
      }
      if (currentHelpers?.error !== helpers.error) {
        setErrorMap((prev) => new Map(prev).set(id, helpers.error));
      }
    },
    [],
  );

  const handleControllerUnmount = useCallback((id: string) => {
    chatHelpersMapRef.current.delete(id);
  }, []);

  const activeMessages = useMemo(() => {
    if (chatId) {
      const messages = messagesMap.get(chatId);
      if (messages) return messages;
      return loadChat(chatId);
    }
    return [];
  }, [chatId, messagesMap]);

  const sendMessageWrapper = useCallback(
    async (
      message: Parameters<UseChatHelpers<UIMessage>["sendMessage"]>[0],
      options?: Parameters<UseChatHelpers<UIMessage>["sendMessage"]>[1],
    ): Promise<void> => {
      if (chatId) {
        const instance = chatHelpersMapRef.current.get(chatId);
        if (instance) {
          instance.sendMessage(message, options);
          return;
        }
        logger.warn(
          `sendMessageWrapper called for active chat ${chatId}, but no instance found.`,
        );
        return;
      }

      const newChatId = createChat(globalDefaultModel.id);
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
    },
    [chatId, navigate, globalDefaultModel.id],
  );

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    const helpers = chatId ? chatHelpersMapRef.current.get(chatId) : undefined;
    const status = chatId ? statusMap.get(chatId) : undefined;

    if (pendingState && (status === "ready" || helpers?.status === "ready")) {
      navigate(location.pathname, { replace: true, state: {} });
      const { message, options } = pendingState;
      helpers?.sendMessage(message, options);
    }
  }, [location.state, location.pathname, navigate, chatId, statusMap]);

  const setModelForActiveChat = useCallback(
    (modelId: string) => {
      const newModel = getModelById(modelId);
      if (!newModel) return;

      if (chatId) {
        setChatModelsMap((prev) => new Map(prev).set(chatId, newModel));
        saveChatModel({ chatId, modelId });
      } else {
        setGlobalDefaultModel(modelId);
      }
    },
    [chatId, setGlobalDefaultModel],
  );

  const statusValue = useMemo(
    () => ({
      status: (chatId ? statusMap.get(chatId) : undefined) || "ready",
      error: chatId ? errorMap.get(chatId) : undefined,
    }),
    [chatId, statusMap, errorMap],
  );

  const functionsValue = useMemo(() => {
    const getHelpers = () =>
      chatId ? chatHelpersMapRef.current.get(chatId) : undefined;
    return {
      sendMessage: sendMessageWrapper,
      addToolResult: (
        ...args: Parameters<UseChatHelpers<UIMessage>["addToolResult"]>
      ) => getHelpers()?.addToolResult(...args) ?? Promise.resolve(),
      regenerate: (
        ...args: Parameters<UseChatHelpers<UIMessage>["regenerate"]>
      ) => getHelpers()?.regenerate(...args) ?? Promise.resolve(),
      resumeStream: (
        ...args: Parameters<UseChatHelpers<UIMessage>["resumeStream"]>
      ) => getHelpers()?.resumeStream(...args) ?? Promise.resolve(),
      stop: () => Promise.resolve(getHelpers()?.stop?.()),
      setMessages: (
        ...args: Parameters<UseChatHelpers<UIMessage>["setMessages"]>
      ) => getHelpers()?.setMessages(...args),
    };
  }, [chatId, sendMessageWrapper]);

  const modelValue = useMemo(
    () => ({
      model: activeModel,
      setModel: setModelForActiveChat,
    }),
    [activeModel, setModelForActiveChat],
  );

  return (
    <>
      {Array.from(loadedChatIds).map((id) => {
        const modelConfig = chatModelsMap.get(id);
        if (!modelConfig) return null;
        return (
          <ChatController
            key={id}
            chatId={id}
            model={modelConfig.model}
            onUpdate={handleControllerUpdate}
            onUnmount={handleControllerUnmount}
          />
        );
      })}
      <ChatModelContext.Provider value={modelValue}>
        <ChatMessagesContext.Provider value={activeMessages}>
          <ChatStatusContext.Provider value={statusValue}>
            <ChatFunctionsContext.Provider value={functionsValue}>
              {children}
            </ChatFunctionsContext.Provider>
          </ChatStatusContext.Provider>
        </ChatMessagesContext.Provider>
      </ChatModelContext.Provider>
    </>
  );
};