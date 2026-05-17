import { type UseChatHelpers } from "@ai-sdk/react";
import { type UIMessage, type UITool, type UIToolInvocation } from "ai";
import { useAtom, useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { ModelContext } from "@/contexts/use-model/model-contexts";
import { useModel } from "@/contexts/use-model/model-hooks";
import { type ChatMetadata } from "@/contexts/use-persistence/persistence-context";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { type ModelConfig, type ModelData } from "@/hooks/ai/use-model-catalog";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { type ChatStatusIndicator, chatIdsAtom, chatStatusIndicatorsAtom } from "@/lib/jotai/atoms";
import { notificationSettingAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { sendNotificationIfAllowed } from "@/lib/notifications";
import { emitWindowSyncEvent, onWindowSyncEvent } from "@/lib/sync/window-sync";

import {
  ChatApprovalHandlerContext,
  ChatFunctionsContext,
  ChatLoadingContext,
  ChatMessagesContext,
  ChatMetadataContext,
  ChatStatusContext,
} from "./chat-contexts";
import { ChatInstance } from "./chat-instance";

const logger = getLogger(import.meta.url);

type ChatInstanceCollection = Map<string, UseChatHelpers<UIMessage>>;

const DEFAULT_CHAT_METADATA: ChatMetadata = {
  title: "New chat",
  titleState: undefined,
  modelId: undefined,
  modelConfig: undefined,
  branchOf: undefined,
};

export const MultiChatProvider = ({ children }: { children: ReactNode }) => {
  const {
    currentModel: defaultModelForNewChats,
    setModel: setDefaultModelForNewChats,
    currentModelConfig: defaultModelConfigForNewChats,
    setModelConfig: setDefaultModelConfigForNewChats,
  } = useModel();
  const {
    createChat,
    loadChatMetadata,
    loadChatMessages,
    saveChatModel,
    saveChatModelConfig,
    isMetadataLoaded,
  } = usePersistence();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const [updateKey, setUpdateKey] = useState(0);
  const forceUpdate = useCallback(() => setUpdateKey((k) => k + 1), []);
  const [chatIds] = useAtom(chatIdsAtom);
  const [notificationSetting] = useAtom(notificationSettingAtom);
  const setChatStatusIndicators = useSetAtom(chatStatusIndicatorsAtom);
  const { getModelById } = useModelCatalog();

  // TODO: Should this use useParams from react router instead?
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

  const loadedMessagesRef = useRef<Map<string, UIMessage[]>>(new Map());
  const [chatMessagesLoaded, setChatMessagesLoaded] = useState<Set<string>>(new Set());
  const loadVersionRef = useRef(0);

  const isChatLoading = useMemo(() => {
    if (!currentChatId) return false;
    return !chatMessagesLoaded.has(currentChatId);
  }, [currentChatId, chatMessagesLoaded]);

  useEffect(() => {
    const version = ++loadVersionRef.current;

    if (!currentChatId) return;
    if (chatMessagesLoaded.has(currentChatId)) return;

    const chatIdToLoad = currentChatId;

    loadChatMessages(chatIdToLoad)
      .then((messages) => {
        if (loadVersionRef.current !== version) return;
        loadedMessagesRef.current.set(chatIdToLoad, messages);
        setChatMessagesLoaded((prev) => {
          const next = new Set(prev);
          next.add(chatIdToLoad);
          return next;
        });
      })
      .catch((error) => {
        logger.error(`Failed to load messages for chat ${chatIdToLoad}`, error);
        if (loadVersionRef.current !== version) return;
        loadedMessagesRef.current.set(chatIdToLoad, []);
        setChatMessagesLoaded((prev) => {
          const next = new Set(prev);
          next.add(chatIdToLoad);
          return next;
        });
      });
  }, [currentChatId, chatMessagesLoaded, loadChatMessages]);

  const getModelForChat = useCallback(
    (chatId: string | undefined): ModelData | undefined => {
      if (chatId) {
        const chatMetadata = loadChatMetadata(chatId);
        if (chatMetadata.modelId) {
          const chatModel = getModelById(chatMetadata.modelId);
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
        const chatMetadata = loadChatMetadata(chatId);
        if (chatMetadata.modelConfig) {
          return chatMetadata.modelConfig;
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
    [currentChatId, setDefaultModelConfigForNewChats, forceUpdate, saveChatModelConfig],
  );

  const modelContextValue = useMemo(
    () => ({
      currentModel: focusedModel,
      setModel: setModelForContext,
      currentModelConfig: focusedModelConfig,
      setModelConfig: setModelConfigForContext,
    }),
    [focusedModel, setModelForContext, focusedModelConfig, setModelConfigForContext],
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

  const handleStatusChange = useCallback(
    (id: string, status: string, hasError?: boolean) => {
      setLastStatusChange({ id, status });

      let emittedIndicator: ChatStatusIndicator | undefined;

      if (status === "streaming" || status === "submitted") {
        setChatStatusIndicators((prev) => ({ ...prev, [id]: "loading" }));
        emittedIndicator = "loading";
      } else if (status === "ready" || status === "error") {
        setChatStatusIndicators((prev) => {
          const currentIndicator = prev[id];
          if (hasError) {
            emittedIndicator = "error";
            return { ...prev, [id]: "error" };
          }
          if (currentIndicator === "error") {
            const { [id]: _removed, ...rest } = prev;
            void _removed;
            emittedIndicator = null;
            return rest;
          }
          if (currentIndicator === "loading") {
            if (id === currentChatId) {
              const { [id]: _removed, ...rest } = prev;
              void _removed;
              emittedIndicator = null;
              return rest;
            }
            emittedIndicator = "unread";
            return { ...prev, [id]: "unread" };
          }
          return prev;
        });
      }

      if (emittedIndicator !== undefined) {
        emitWindowSyncEvent({
          type: "chat-status",
          chatId: id,
          status: emittedIndicator,
        });
      }
    },
    [setChatStatusIndicators, currentChatId],
  );

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    void onWindowSyncEvent((event) => {
      if (event.type !== "chat-status") return;
      setChatStatusIndicators((prev) => {
        if (event.status === null) {
          if (!(event.chatId in prev)) return prev;
          const { [event.chatId]: _removed, ...rest } = prev;
          void _removed;
          return rest;
        }
        return { ...prev, [event.chatId]: event.status };
      });
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [setChatStatusIndicators]);

  useEffect(() => {
    if (currentChatId) {
      setChatStatusIndicators((prev) => {
        const currentIndicator = prev[currentChatId];
        if (currentIndicator === "unread") {
          const { [currentChatId]: _removed, ...rest } = prev;
          void _removed;
          return rest;
        }
        return prev;
      });
    }
  }, [currentChatId, setChatStatusIndicators]);

  const evictInactiveMessages = useCallback((keepIds: Set<string>) => {
    for (const id of loadedMessagesRef.current.keys()) {
      if (!keepIds.has(id)) {
        loadedMessagesRef.current.delete(id);
      }
    }
    setChatMessagesLoaded((prevLoaded) => {
      let changed = false;
      for (const id of prevLoaded) {
        if (!keepIds.has(id)) {
          changed = true;
          break;
        }
      }
      if (!changed) return prevLoaded;

      const next = new Set<string>();
      for (const id of prevLoaded) {
        if (keepIds.has(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const newActiveIds = new Set<string>();
    if (currentChatId) {
      newActiveIds.add(currentChatId);
    }

    chatInstancesRef.current.forEach((instance, id) => {
      const isBusy =
        instance.status === "streaming" ||
        instance.status === "submitted" ||
        instance.status === "error";
      if (isBusy) {
        newActiveIds.add(id);
      }
    });

    evictInactiveMessages(newActiveIds);

    setActiveChatIds((prev) => {
      if (prev.size === newActiveIds.size && [...prev].every((id) => newActiveIds.has(id))) {
        return prev;
      }

      logger.verbose("Updating active chat IDs", {
        new: Array.from(newActiveIds),
      });
      return newActiveIds;
    });
  }, [currentChatId, lastStatusChange, evictInactiveMessages]);

  const defaultChat = useChat(
    defaultModelForNewChats?.model ?? null,
    defaultModelForNewChats?.id ?? null,
    defaultModelConfigForNewChats,
  );

  const handleNewChatSubmit = useCallback(
    (
      message: Parameters<typeof defaultChat.sendMessage>[0],
      options?: Parameters<typeof defaultChat.sendMessage>[1],
    ) => {
      if (!focusedModel) return Promise.resolve();
      const newChatId = createChat(focusedModel.id, focusedModelConfig);
      loadedMessagesRef.current.set(newChatId, []);
      setChatMessagesLoaded((prev) => {
        const next = new Set(prev);
        next.add(newChatId);
        return next;
      });
      void navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, defaultChat.sendMessage, focusedModel?.id, focusedModelConfig],
  );

  const isNewChat = !currentChatId;
  const focusedChatInstance = currentChatId
    ? chatInstancesRef.current.get(currentChatId)
    : undefined;
  const lastFocusedChatInstanceRef = useRef<UseChatHelpers<UIMessage> | undefined>(undefined);

  if (focusedChatInstance) {
    lastFocusedChatInstanceRef.current = focusedChatInstance;
  } else if (!currentChatId) {
    lastFocusedChatInstanceRef.current = undefined;
  }

  const stableFocusedChatInstance = focusedChatInstance ?? lastFocusedChatInstanceRef.current;

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    if (pendingState && focusedChatInstance?.status === "ready" && currentChatId) {
      const instance = chatInstancesRef.current.get(currentChatId);
      if (instance?.sendMessage) {
        void navigate(location.pathname, { replace: true, state: {} });
        const { message, options } = pendingState;
        void instance.sendMessage(message, options);
      }
    }
  }, [location.state, location.pathname, navigate, focusedChatInstance?.status, currentChatId]);

  const currentMessages = currentChatId
    ? (stableFocusedChatInstance?.messages ?? [])
    : defaultChat.messages;
  const prevMessagesRef = useRef<UIMessage[]>(currentMessages);
  if (!isChatLoading) {
    prevMessagesRef.current = currentMessages;
  }
  const messages = isChatLoading ? prevMessagesRef.current : currentMessages;

  const statusValue = useMemo(
    () => ({
      status: currentChatId ? (stableFocusedChatInstance?.status ?? "ready") : defaultChat.status,
      error: currentChatId ? stableFocusedChatInstance?.error : defaultChat.error,
    }),
    [
      currentChatId,
      stableFocusedChatInstance?.status,
      stableFocusedChatInstance?.error,
      defaultChat.status,
      defaultChat.error,
    ],
  );

  const metadataValue = currentChatId ? loadChatMetadata(currentChatId) : DEFAULT_CHAT_METADATA;

  const instanceForFunctions = currentChatId ? stableFocusedChatInstance : defaultChat;
  const noopAsync = useCallback(async () => {}, []);
  const noopSetMessages = useCallback<UseChatHelpers<UIMessage>["setMessages"]>(() => {}, []);
  const {
    addToolOutput = noopAsync,
    addToolApprovalResponse = noopAsync,
    regenerate = noopAsync,
    clearError = () => {},
    resumeStream = noopAsync,
    stop = noopAsync,
    setMessages = noopSetMessages,
    sendMessage = noopAsync,
  } = instanceForFunctions ?? {};

  const wasBusyRef = useRef(false);
  useEffect(() => {
    if (statusValue.status === "streaming" || statusValue.status === "submitted") {
      wasBusyRef.current = true;
    }

    if (wasBusyRef.current && statusValue.status === "ready") {
      wasBusyRef.current = false;

      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        let hasChanges = false;
        const newParts = lastMessage.parts.map((part) => {
          if (
            (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
            "state" in part &&
            (part.state === "approval-responded" ||
              part.state === "input-streaming" ||
              part.state === "input-available" ||
              (part.state === "output-available" &&
                (part as { preliminary?: boolean }).preliminary === true))
          ) {
            hasChanges = true;
            return {
              ...part,
              state: "output-error",
              errorText: TOOL_CANCELLED_BY_USER_SYMBOL,
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
          void sendNotificationIfAllowed(
            "AgentOne Finished Responding",
            "You can disable this notification in settings.",
          );
        }
      }
    }

    if (statusValue.status === "error") {
      wasBusyRef.current = false;
    }
  }, [statusValue.status, messages, setMessages, notificationSetting]);

  useEffect(() => {
    if (!isMetadataLoaded) return;

    chatInstancesRef.current.forEach((instance, id) => {
      if (!chatIds.includes(id)) {
        const { status, stop } = instance;
        if (status === "streaming" || status === "submitted") {
          logger.verbose(`Stopping stream for deleted chat: ${id}`);
          void stop();
        }
      }
    });

    if (currentChatId && !chatIds.includes(currentChatId)) {
      logger.verbose(`Invalid chat ID detected: ${currentChatId}. Redirecting to /chat`);
      void navigate("/chat", { replace: true });
    }
  }, [currentChatId, chatIds, navigate, isMetadataLoaded]);

  const functionsValue = useMemo(
    () => ({
      sendMessage: isNewChat ? handleNewChatSubmit : sendMessage,
      addToolOutput,
      addToolApprovalResponse,
      regenerate,
      clearError,
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
      clearError,
      resumeStream,
      stop,
      setMessages,
    ],
  );

  const approvalHandlerValue = useMemo(
    () =>
      async ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
        await addToolApprovalResponse({ id, approved, reason });
      },
    [addToolApprovalResponse],
  );

  return (
    <ModelContext.Provider value={modelContextValue}>
      {Array.from(activeChatIds).map((id) => {
        if (!chatMessagesLoaded.has(id)) return null;
        const chatModel = getModelForChat(id);
        const chatConfig = getConfigForChat(id);
        if (!chatModel) return null;
        const initialMessages = loadedMessagesRef.current.get(id) ?? [];
        return (
          <ChatInstance
            key={id}
            chatId={id}
            model={chatModel.model}
            modelId={chatModel.id}
            modelConfig={chatConfig}
            initialMessages={initialMessages}
            onInstanceUpdate={handleInstanceUpdate}
            onStatusChange={handleStatusChange}
          />
        );
      })}
      <ChatMessagesContext.Provider value={messages}>
        <ChatStatusContext.Provider value={statusValue}>
          <ChatMetadataContext.Provider value={metadataValue}>
            <ChatLoadingContext.Provider value={isChatLoading}>
              <ChatFunctionsContext.Provider value={functionsValue}>
                <ChatApprovalHandlerContext.Provider value={approvalHandlerValue}>
                  {children}
                </ChatApprovalHandlerContext.Provider>
              </ChatFunctionsContext.Provider>
            </ChatLoadingContext.Provider>
          </ChatMetadataContext.Provider>
        </ChatStatusContext.Provider>
      </ChatMessagesContext.Provider>
    </ModelContext.Provider>
  );
};
