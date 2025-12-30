import { type UseChatHelpers } from "@ai-sdk/react";
import { type UIMessage, type UITool, type UIToolInvocation } from "ai";
import { useAtom } from "jotai";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { ModelContext } from "@/contexts/use-model/model-contexts";
import { useModel } from "@/contexts/use-model/model-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { type ModelConfig, type ModelData } from "@/hooks/ai/use-model-catalog";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import { notificationSettingAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { sendNotificationIfAllowed } from "@/lib/notifications";

import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";
import { ChatInstance } from "./chat-instance";

const logger = getLogger(import.meta.url);

type ChatInstanceCollection = Map<string, UseChatHelpers<UIMessage>>;

export const MultiChatProvider = ({ children }: { children: ReactNode }) => {
  const {
    currentModel: defaultModelForNewChats,
    setModel: setDefaultModelForNewChats,
    currentModelConfig: defaultModelConfigForNewChats,
    setModelConfig: setDefaultModelConfigForNewChats,
  } = useModel();
  const { createChat, loadChatData, saveChatModel, saveChatModelConfig } =
    usePersistence();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [updateKey, setUpdateKey] = useState(0);
  const forceUpdate = useCallback(() => setUpdateKey((k) => k + 1), []);
  const [chatIds] = useAtom(chatIdsAtom);
  const [notificationSetting] = useAtom(notificationSettingAtom);
  const { getModelById } = useModelCatalog();

  const currentChatId = useMemo(() => {
    if (location.pathname.startsWith("/chat/")) {
      return params.id;
    }
    return undefined;
  }, [location.pathname, params.id]);

  const chatInstancesRef = useRef<ChatInstanceCollection>(new Map());

  const [activeChatIds, setActiveChatIds] = useState<Set<string>>(() =>
    currentChatId ? new Set([currentChatId]) : new Set(),
  );

  const [lastStatusChange, setLastStatusChange] = useState({
    id: "",
    status: "",
  });

  const getModelForChat = useCallback(
    (chatId: string | undefined): ModelData => {
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
    [defaultModelForNewChats, updateKey, getModelById],
  );

  const getConfigForChat = useCallback(
    (chatId: string | undefined): ModelConfig => {
      if (chatId) {
        const chatData = loadChatData(chatId);
        if (chatData.modelConfig) {
          return chatData.modelConfig;
        }
      }
      return defaultModelConfigForNewChats;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultModelConfigForNewChats, updateKey],
  );

  const focusedModel = useMemo(
    () => getModelForChat(currentChatId),
    [currentChatId, getModelForChat],
  );

  const rawFocusedModelConfig = getConfigForChat(currentChatId);
  // Stabilize the config object to prevent context updates when content hasn't changed
  const focusedModelConfig = useMemo(
    () => rawFocusedModelConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(rawFocusedModelConfig)],
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
    [currentChatId, setDefaultModelForNewChats, forceUpdate, saveChatModel],
  );

  const setModelConfigForContext = useCallback(
    (config: ModelConfig) => {
      if (currentChatId) {
        saveChatModelConfig({ chatId: currentChatId, modelConfig: config });
        forceUpdate();
      } else {
        setDefaultModelConfigForNewChats(config);
      }
    },
    [
      currentChatId,
      setDefaultModelConfigForNewChats,
      forceUpdate,
      saveChatModelConfig,
    ],
  );

  const modelContextValue = useMemo(
    () => ({
      currentModel: focusedModel,
      setModel: setModelForContext,
      currentModelConfig: focusedModelConfig,
      setModelConfig: setModelConfigForContext,
    }),
    [
      focusedModel,
      setModelForContext,
      focusedModelConfig,
      setModelConfigForContext,
    ],
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

  const defaultChat = useChat(
    defaultModelForNewChats.model,
    defaultModelConfigForNewChats,
  );

  const handleNewChatSubmit = useCallback(
    (
      message: Parameters<typeof defaultChat.sendMessage>[0],
      options?: Parameters<typeof defaultChat.sendMessage>[1],
    ) => {
      const newChatId = createChat(focusedModel.id, focusedModelConfig);
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, defaultChat.sendMessage, focusedModel.id, focusedModelConfig],
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
    addToolOutput,
    addToolApprovalResponse,
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

        if (
          notificationSetting === "always" ||
          (notificationSetting === "when-unfocused" && !document.hasFocus())
        ) {
          sendNotificationIfAllowed(
            "AgentOne Finished Responding",
            "You can disable this notification in settings.",
          );
        }
      }
    }
  }, [statusValue.status, messages, setMessages, notificationSetting]);

  useEffect(() => {
    if (currentChatId && !chatIds.includes(currentChatId)) {
      const instance = chatInstancesRef.current.get(currentChatId);
      if (instance) {
        const { status, stop } = instance;
        if (status === "streaming" || status === "submitted") {
          logger.verbose(`Stopping stream for deleted chat: ${currentChatId}`);
          stop();
        }
      }
    }
  }, [currentChatId, chatIds]);

  const functionsValue = useMemo(
    () => ({
      sendMessage: isNewChat ? handleNewChatSubmit : sendMessage,
      addToolOutput,
      addToolApprovalResponse,
      regenerate,
      resumeStream,
      stop,
      setMessages,
    }),
    [
      isNewChat,
      handleNewChatSubmit,
      sendMessage,
      addToolOutput,
      addToolApprovalResponse,
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
        const chatConfig = getConfigForChat(id);
        return (
          <ChatInstance
            key={id}
            chatId={id}
            model={chatModel.model}
            modelConfig={chatConfig}
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
