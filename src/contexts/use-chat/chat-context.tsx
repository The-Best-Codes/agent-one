import { type UseChatHelpers } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import {
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
import { createChat } from "@/lib/ai/persistence";
import { getLogger } from "@/lib/logger";

import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";
import { ChatInstance } from "./chat-instance";

const logger = getLogger(import.meta.url);

type ChatInstanceCollection = Map<string, UseChatHelpers<UIMessage>>;

const useForceUpdate = () => {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
};

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
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const forceUpdate = useForceUpdate();
  const model = useMemo(() => currentModel.model, [currentModel.model]);

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
  const defaultChat = useChat(model);

  // Wrapper for sending a message from the "new chat" screen
  const handleNewChatSubmit = useCallback(
    (
      message: Parameters<typeof defaultChat.sendMessage>[0],
      options?: Parameters<typeof defaultChat.sendMessage>[1],
    ) => {
      const newChatId = createChat();
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, defaultChat.sendMessage],
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
    <>
      {Array.from(activeChatIds).map((id) => (
        <ChatInstance
          key={id}
          chatId={id}
          model={model}
          onInstanceUpdate={handleInstanceUpdate}
          onStatusChange={handleStatusChange}
        />
      ))}
      <ChatMessagesContext.Provider value={messages}>
        <ChatStatusContext.Provider value={statusValue}>
          <ChatFunctionsContext.Provider value={functionsValue}>
            {children}
          </ChatFunctionsContext.Provider>
        </ChatStatusContext.Provider>
      </ChatMessagesContext.Provider>
    </>
  );
};
