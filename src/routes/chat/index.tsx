import { invoke } from "@tauri-apps/api/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { AutoScrollContainer, type AutoScrollHandle } from "@/components/a1/auto-scroll-container";
import { ChatAlreadyOpenDialog } from "@/components/a1/chat-already-open-dialog";
import { ChatMessageLoading } from "@/components/a1/chat-message-loading";
import { ChatUsageStatus } from "@/components/a1/chat-usage-status";
import { NoMessagesGreeting } from "@/components/a1/empty-states/no-messages";
import { MainChatInput } from "@/components/a1/input/main-chat-input";
import { MessageParts } from "@/components/a1/messages";
import { Sidebar } from "@/components/a1/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useChatLoading, useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import {
  clearEditingMessagesAtom,
  editingMessageIdsAtom,
} from "@/lib/jotai/chat-message-editing-atoms";
import {
  chatVirtualizationModeAtom,
  chatVirtualizationThresholdAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

type ChatOpenStatus = {
  otherWindowCount: number;
  openedHere: boolean;
};

const logger = getLogger(import.meta.url);

const syncCurrentWindowChat = async (chatId: string | null, ownerToken: string, force = false) => {
  return invoke<ChatOpenStatus>("sync_current_window_chat", { chatId, ownerToken, force });
};

const ChatInterface = ({ chatId }: { chatId: string | undefined }) => {
  const messages = useChatMessages();
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<AutoScrollHandle | null>(null);
  const [delayPassed, setDelayPassed] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const editingMessageIds = useAtomValue(editingMessageIdsAtom);
  const chatVirtualizationMode = useAtomValue(chatVirtualizationModeAtom);
  const chatVirtualizationThreshold = useAtomValue(chatVirtualizationThresholdAtom);
  const clearEditingMessages = useSetAtom(clearEditingMessagesAtom);

  useEffect(() => {
    clearEditingMessages();

    return () => {
      clearEditingMessages();
    };
  }, [chatId, clearEditingMessages]);

  useEffect(() => {
    if (isChatLoading) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsInitialLoad(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isChatLoading]);

  useEffect(() => {
    if (!isChatLoading) {
      return;
    }
    const timer = setTimeout(() => {
      setDelayPassed(true);
    }, CHAT_LOADING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setDelayPassed(false);
    };
  }, [isChatLoading]);

  const showSpinner = isChatLoading && (isInitialLoad || delayPassed);

  useEffect(() => {
    if (!isChatLoading) {
      scrollRef.current?.scrollToBottom();
    }
  }, [chatId, isChatLoading]);

  const lastMessageId = messages[messages.length - 1]?.id;
  const initialInputValue = searchParams.get("initialMessage") || undefined;
  const shouldVirtualizeMessages =
    chatVirtualizationMode !== "off" && messages.length >= chatVirtualizationThreshold;
  const messageItems = useMemo(
    () =>
      messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === "user"
              ? "justify-end"
              : index === messages.length - 1
                ? "justify-start"
                : "mb-1 justify-start",
          )}
        >
          <MessageParts message={message} isLastMessage={message.id === lastMessageId} />
        </div>
      )),
    [lastMessageId, messages],
  );
  const keepMountedIndexes = useMemo(
    () =>
      editingMessageIds
        .map((editingMessageId) => messages.findIndex((message) => message.id === editingMessageId))
        .filter((index) => index >= 0),
    [editingMessageIds, messages],
  );

  return (
    <main className="flex h-svh" role="main" data-testid="main">
      <Sidebar />
      {chatId && <ChatUsageStatus />}

      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-center"
        data-testid="chat-main"
      >
        <div className="flex h-full w-full max-w-3xl flex-1 flex-col">
          {isChatLoading && showSpinner ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="text-muted-foreground size-8" />
            </div>
          ) : (
            <AutoScrollContainer
              ref={scrollRef}
              className="max-h-full min-h-0 flex-1 pt-2 pr-0 pb-2"
              virtualizedItems={shouldVirtualizeMessages ? messageItems : undefined}
              virtualizedKeepMounted={shouldVirtualizeMessages ? keepMountedIndexes : undefined}
              contentUpdateKey={shouldVirtualizeMessages ? messages : undefined}
              overflowingClassName="md:pr-2"
              scrollableClassName="pr-2 h-full"
              behavior="instant"
              buttonScrollBehavior={status === "streaming" ? "instant" : "smooth"}
            >
              {messages.length === 0 && <NoMessagesGreeting />}
              {!shouldVirtualizeMessages && messageItems}
              {messages.length > 0 && <ChatMessageLoading mode="inLayout" />}
            </AutoScrollContainer>
          )}
          <MainChatInput
            key={chatId || "new-chat"}
            initialValue={initialInputValue}
            disabled={isChatLoading}
            onScrollNeededAction={() => {
              scrollRef.current?.scrollToBottom();
            }}
          />
        </div>
      </div>
    </main>
  );
};

function ChatRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ownerTokenRef = useRef<string | null>(null);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  const [otherWindowCount, setOtherWindowCount] = useState(0);
  const currentRouteChatIdRef = useRef<string | null>(null);

  if (currentRouteChatIdRef.current !== (id ?? null)) {
    currentRouteChatIdRef.current = id ?? null;
    if (pendingChatId !== null) {
      setPendingChatId(null);
    }
    if (otherWindowCount !== 0) {
      setOtherWindowCount(0);
    }
  }

  useEffect(() => {
    if (!id) {
      ownerTokenRef.current = null;
      return;
    }

    let cancelled = false;
    const ownerToken = crypto.randomUUID();
    ownerTokenRef.current = ownerToken;

    void (async () => {
      try {
        const status = await syncCurrentWindowChat(id, ownerToken);
        if (cancelled) {
          return;
        }

        setOtherWindowCount(status.otherWindowCount);

        if (!status.openedHere) {
          setPendingChatId(id);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("Failed to sync current window chat", { chatId: id, error });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (ownerTokenRef.current === ownerToken) {
        ownerTokenRef.current = null;
      }
      void syncCurrentWindowChat(null, ownerToken).catch((error) => {
        logger.error("Failed to clear current window chat", { chatId: id, error });
      });
    };
  }, [id]);

  return (
    <>
      <ChatInterface chatId={id} />
      <ChatAlreadyOpenDialog
        isOpen={pendingChatId === id && otherWindowCount > 0}
        otherWindowCount={otherWindowCount}
        onConfirm={() => {
          const ownerToken = ownerTokenRef.current;
          if (id && ownerToken) {
            void syncCurrentWindowChat(id, ownerToken, true)
              .then((status) => {
                setOtherWindowCount(status.otherWindowCount);
                if (status.openedHere) {
                  setPendingChatId(null);
                }
              })
              .catch((error) => {
                logger.error("Failed to force-open chat in current window", {
                  chatId: id,
                  error,
                });
              });
          }
        }}
        onCancel={() => {
          setPendingChatId(null);
          void navigate("/chat");
        }}
      />
    </>
  );
}

export default ChatRoute;
