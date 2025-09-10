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
import { useLocation, useNavigate } from "react-router";

import { ModelContext } from "@/contexts/use-model/model-contexts";
import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import { getModelById, type ModelConfig } from "@/lib/ai/models";
import { createChat, loadChatData, saveChatModel } from "@/lib/ai/persistence";
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
  const navigate = useNavigate();
  const location = useLocation();
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

  const getModelForChat = useCallback(
    (chatId: string | undefined): ModelConfig => {
      if (chatId) {
        const chatData = loadChatData(chatId);
        if (chatData.modelId) {
          const chatModel = getModelById(chatData.modelId);
          if (chatModel) {
            return chatModel;
          }
        }
      }
      return defaultModelForNewChats;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultModelForNewChats, updateKey],
  );

  const focusedModel = useMemo(
    () => getModelForChat(currentChatId),
    [currentChatId, getModelForChat],
  );

  const setModelForContext = useCallback(
    (modelId: string) => {
      if (currentChatId) {
        saveChatModel({ chatId: currentChatId, modelId });
        forceUpdate();
      } else {
        setDefaultModelForNewChats(modelId);
      }
    },
    [currentChatId, setDefaultModelForNewChats, forceUpdate],
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
    (
      message: Parameters<typeof defaultChat.sendMessage>[0],
      options?: Parameters<typeof defaultChat.sendMessage>[1],
    ) => {
      const newChatId = createChat(focusedModel.id);
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, defaultChat.sendMessage, focusedModel.id],
  );

  const isNewChat = !currentChatId;
  const focusedChatInstance = currentChatId
    ? chatInstancesRef.current.get(currentChatId)
    : undefined;

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    if (
      pendingState &&
      focusedChatInstance?.status === "ready" &&
      currentChatId
    ) {
      const instance = chatInstancesRef.current.get(currentChatId);
      if (instance?.sendMessage) {
        navigate(location.pathname, { replace: true, state: {} });
        const { message, options } = pendingState;
        instance.sendMessage(message, options);
      }
    }
  }, [
    location.state,
    location.pathname,
    navigate,
    focusedChatInstance?.status,
    currentChatId,
  ]);

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
