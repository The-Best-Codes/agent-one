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
import { type UseChatHelpers } from "@ai-sdk/react";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModel,
  type UIMessage,
} from "ai";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
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
  }: {
    chatId: string;
    model: LanguageModel;
    onUpdate: (id: string, helpers: UseChatHelpers<UIMessage>) => void;
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
      };
    }, [chatId, chatHelpers.stop]);

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

  const [managedChatIds, setManagedChatIds] = useState<Set<string>>(
    chatId ? new Set([chatId]) : new Set(),
  );

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

  useEffect(() => {
    if (chatId && !managedChatIds.has(chatId)) {
      setManagedChatIds((prev) => new Set(prev).add(chatId));
    }
  }, [chatId, managedChatIds]);

  useEffect(() => {
    managedChatIds.forEach((id) => {
      if (!chatModelsMap.has(id)) {
        const savedData = loadChatData(id);
        const model = getModelById(savedData.modelId) || getDefaultModel();
        setChatModelsMap((prev) => new Map(prev).set(id, model));
      }
    });
  }, [managedChatIds, chatModelsMap]);

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

  const activeMessages = useMemo(
    () => (chatId && messagesMap.get(chatId)) || [],
    [chatId, messagesMap],
  );

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
          `sendMessageWrapper called for active chat ${chatId}, but no data found.`,
        );
        return;
      }

      const newChatId = createChat(globalDefaultModel.id);
      setManagedChatIds((prev) => new Set(prev).add(newChatId));
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
      {Array.from(managedChatIds).map((id) => {
        const modelConfig = chatModelsMap.get(id);
        if (!modelConfig) return null;
        return (
          <ChatController
            key={id}
            chatId={id}
            model={modelConfig.model}
            onUpdate={handleControllerUpdate}
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
