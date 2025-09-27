import { type UseChatHelpers } from "@ai-sdk/react";
import { type UIMessage, type UITool, type UIToolInvocation } from "ai";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";

import { ModelContext } from "@/contexts/use-model/model-contexts";
import { useModel } from "@/contexts/use-model/model-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { getModelById, type ModelConfig } from "@/lib/ai/models";
import { getLogger } from "@/lib/logger";

import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";
import { ChatInstance } from "./chat-instance";

const logger = getLogger(import.meta.url);

type ChatInstanceCollection = Map<string, UseChatHelpers<UIMessage>>;

export const MultiChatProvider = ({
  children,
  currentChatId,
}: {
  children: ReactNode;
  currentChatId: string | undefined;
}) => {
  const {
    currentModel: defaultModelForNewChats,
    setModel: setDefaultModelForNewChats,
  } = useModel();
  const persistence = usePersistence();
  const navigate = useNavigate();
  const [updateKey, setUpdateKey] = useState(0);
  const forceUpdate = useCallback(() => setUpdateKey((k) => k + 1), []);

  const chatInstancesRef = useRef<ChatInstanceCollection>(new Map());

  const [activeChatIds, setActiveChatIds] = useState<Set<string>>(() =>
    currentChatId ? new Set([currentChatId]) : new Set(),
  );

  const [lastStatusChange, setLastStatusChange] = useState({
    id: "",
    status: "",
  });

  const [chatModels, setChatModels] = useState<Record<string, ModelConfig>>({});

  useEffect(() => {
    const fetchChatModels = async () => {
      if (currentChatId) {
        const chatData = await persistence.loadChat(currentChatId);
        if (chatData?.modelId) {
          const model = getModelById(chatData.modelId);
          if (model) {
            setChatModels((prev) => ({ ...prev, [currentChatId]: model }));
          }
        }
      }
    };
    fetchChatModels();
  }, [currentChatId, persistence]);

  const getModelForChat = useCallback(
    (chatId: string | undefined): ModelConfig => {
      if (chatId && chatModels[chatId]) {
        return chatModels[chatId];
      }
      return defaultModelForNewChats;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatModels, defaultModelForNewChats, updateKey],
  );

  const focusedModel = useMemo(
    () => getModelForChat(currentChatId),
    [currentChatId, getModelForChat],
  );

  const setModelForContext = useCallback(
    async (modelId: string) => {
      if (currentChatId) {
        await persistence.saveChatModel(currentChatId, modelId);
        const model = getModelById(modelId);
        if (model) {
          setChatModels((prev) => ({ ...prev, [currentChatId]: model }));
        }
        forceUpdate();
      } else {
        await setDefaultModelForNewChats(modelId);
      }
    },
    [currentChatId, setDefaultModelForNewChats, forceUpdate, persistence],
  );

  const modelContextValue = useMemo(
    () => ({
      currentModel: focusedModel,
      setModel: setModelForContext,
    }),
    [focusedModel, setModelForContext],
  );

  const handleInstanceUpdate = useCallback(
    (id: string, instance: UseChatHelpers<UIMessage> | null) => {
      if (instance) {
        chatInstancesRef.current.set(id, instance);
      } else {
        chatInstancesRef.current.delete(id);
      }
      if (id === currentChatId) {
        forceUpdate();
      }
    },
    [currentChatId, forceUpdate],
  );

  const handleStatusChange = useCallback((id: string, status: string) => {
    setLastStatusChange({ id, status });
  }, []);

  useEffect(() => {
    const newActiveIds = new Set<string>();
    if (currentChatId) {
      newActiveIds.add(currentChatId);
    }

    chatInstancesRef.current.forEach((instance, id) => {
      const isBusy =
        instance.status === "streaming" || instance.status === "submitted";
      if (isBusy) {
        newActiveIds.add(id);
      }
    });

    setActiveChatIds((prev) => {
      if (
        prev.size === newActiveIds.size &&
        [...prev].every((id) => newActiveIds.has(id))
      ) {
        return prev;
      }
      logger.verbose("Updating active chat IDs", {
        new: Array.from(newActiveIds),
      });
      return newActiveIds;
    });
  }, [currentChatId, lastStatusChange]);

  const defaultChat = useChat(defaultModelForNewChats.model);

  const handleNewChatSubmit = useCallback(
    async (
      message: Parameters<typeof defaultChat.sendMessage>[0],
      options?: Parameters<typeof defaultChat.sendMessage>[1],
    ) => {
      const newChatId = await persistence.createChat(focusedModel.id);
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, persistence, focusedModel.id, defaultChat.sendMessage],
  );

  const isNewChat = !currentChatId;
  const focusedChatInstance = currentChatId
    ? chatInstancesRef.current.get(currentChatId)
    : undefined;

  const messages = focusedChatInstance?.messages ?? defaultChat.messages;

  const statusValue = useMemo(
    () => ({
      status: focusedChatInstance?.status ?? defaultChat.status,
      error: focusedChatInstance?.error ?? defaultChat.error,
    }),
    [
      focusedChatInstance?.status,
      focusedChatInstance?.error,
      defaultChat.status,
      defaultChat.error,
    ],
  );

  const instanceForFunctions = focusedChatInstance || defaultChat;
  const {
    addToolResult,
    regenerate,
    resumeStream,
    stop,
    setMessages,
    sendMessage,
  } = instanceForFunctions;

  const wasStreamingRef = useRef(false);
  useEffect(() => {
    if (statusValue.status === "streaming") {
      wasStreamingRef.current = true;
    }

    if (wasStreamingRef.current && statusValue.status === "ready") {
      wasStreamingRef.current = false;

      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        let hasChanges = false;
        const newParts = lastMessage.parts.map((part) => {
          if (
            (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
            "state" in part &&
            (part.state === "input-streaming" ||
              part.state === "input-available")
          ) {
            hasChanges = true;
            return {
              ...part,
              state: "output-error",
              errorText: "agent-one::cancelled-by-user",
            } as UIToolInvocation<UITool>;
          }
          return part;
        });

        if (hasChanges) {
          const updatedMessage: UIMessage = {
            ...lastMessage,
            parts: newParts as UIMessage["parts"],
          };

          const newMessages = [...messages.slice(0, -1), updatedMessage];
          if (setMessages) {
            setMessages(newMessages);
          }
        }
      }
    }
  }, [statusValue.status, messages, setMessages]);

  const functionsValue = useMemo(
    () => ({
      sendMessage: isNewChat ? handleNewChatSubmit : sendMessage,
      addToolResult,
      regenerate,
      resumeStream,
      stop,
      setMessages,
    }),
    [
      isNewChat,
      handleNewChatSubmit,
      sendMessage,
      addToolResult,
      regenerate,
      resumeStream,
      stop,
      setMessages,
    ],
  );

  return (
    <ModelContext.Provider value={modelContextValue}>
      {Array.from(activeChatIds).map((id) => {
        const chatModel = getModelForChat(id);
        return (
          <ChatInstance
            key={id}
            chatId={id}
            model={chatModel.model}
            onInstanceUpdate={handleInstanceUpdate}
            onStatusChange={handleStatusChange}
          />
        );
      })}
      <ChatMessagesContext.Provider value={messages}>
        <ChatStatusContext.Provider value={statusValue}>
          <ChatFunctionsContext.Provider value={functionsValue}>
            {children}
          </ChatFunctionsContext.Provider>
        </ChatStatusContext.Provider>
      </ChatMessagesContext.Provider>
    </ModelContext.Provider>
  );
};
