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

/**
 * Manages multiple chat sessions, keeping background chats alive while they are streaming
 * and only forwarding the state of the currently focused chat to the UI.
 */
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

  // Ref to store all active useChat instances
  const chatInstancesRef = useRef<ChatInstanceCollection>(new Map());

  // State to track which chat IDs need to be kept in memory
  const [activeChatIds, setActiveChatIds] = useState<Set<string>>(() =>
    currentChatId ? new Set([currentChatId]) : new Set(),
  );

  // State to trigger cleanup effect when any chat's status changes
  const [lastStatusChange, setLastStatusChange] = useState({
    id: "",
    status: "",
  });

  // Helper to get the model for a given chat ID, with fallback
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
      // Fallback for new chat or chat with no/invalid model
      return defaultModelForNewChats;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultModelForNewChats, updateKey],
  );

  // The model for the currently focused chat/UI
  const focusedModel = useMemo(
    () => getModelForChat(currentChatId),
    [currentChatId, getModelForChat],
  );

  // A new setModel function that handles both new and existing chats
  const setModelForContext = useCallback(
    (modelId: string) => {
      if (currentChatId) {
        // Update the model for the specific chat we're viewing
        saveChatModel({ chatId: currentChatId, modelId });
        forceUpdate(); // Re-render to update focusedModel and ChatInstance props
      } else {
        // We are on a "new chat" page, update the default model for new chats
        setDefaultModelForNewChats(modelId);
      }
    },
    [currentChatId, setDefaultModelForNewChats, forceUpdate],
  );

  // The context value to provide to UI components like ModelSelector
  const modelContextValue = useMemo(
    () => ({
      currentModel: focusedModel,
      setModel: setModelForContext,
    }),
    [focusedModel, setModelForContext],
  );

  // Callback for ChatInstance to register/update itself
  const handleInstanceUpdate = useCallback(
    (id: string, instance: UseChatHelpers<UIMessage> | null) => {
      if (instance) {
        chatInstancesRef.current.set(id, instance);
      } else {
        chatInstancesRef.current.delete(id);
      }
      // Only trigger a re-render of the provider if the updated
      // chat is the one currently being displayed. Background chats
      // will update their state in the ref without causing a UI update.
      if (id === currentChatId) {
        forceUpdate();
      }
    },
    [currentChatId, forceUpdate],
  );

  // Callback for ChatInstance to report status changes
  const handleStatusChange = useCallback((id: string, status: string) => {
    setLastStatusChange({ id, status });
  }, []);

  // Effect to manage which chats are active (focused or streaming in background)
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

  // Default `useChat` instance for the "new chat" screen
  const defaultChat = useChat(defaultModelForNewChats.model);

  // Wrapper for sending a message from the "new chat" screen
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

  // Select the currently focused chat instance
  const isNewChat = !currentChatId;
  const focusedChatInstance = currentChatId
    ? chatInstancesRef.current.get(currentChatId)
    : undefined;

  // Handle submitting a message passed via navigation state
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

  // Memoize context values to prevent unnecessary re-renders
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
