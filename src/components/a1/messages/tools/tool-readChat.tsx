import { IconCircleCheck, IconCircleX, IconMessages, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { chatIdsAtom } from "@/lib/jotai/atoms";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ReadChatInput {
  chatId?: string;
}

interface ReadChatOutput {
  chatId?: string;
  title?: string;
  isCurrent?: boolean;
  start?: number;
  end?: number;
  transcriptChars?: number;
}

const ReadChatApprovalTarget = ({ chatId }: { chatId?: string }) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const chatIds = useAtomValue(chatIdsAtom);
  const { loadChatMetadata } = usePersistence();

  if (!chatId) return <span>AgentOne wants to read a past chat</span>;
  if (chatId === activeChatId) return <span>AgentOne wants to read this chat</span>;
  if (!chatIds.includes(chatId))
    return (
      <span className="max-w-2xl truncate">{`AgentOne wants to read unknown chat "${chatId}"`}</span>
    );

  return (
    <span className="flex max-w-2xl min-w-0 gap-1">
      <span className="shrink-0">AgentOne wants to read</span>
      <Link to={`/chat/${chatId}`} className="truncate hover:underline">
        {loadChatMetadata(chatId).title}
      </Link>
    </span>
  );
};

export const MessagePartToolReadChat = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = part.input as ReadChatInput | undefined;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1 text-sm font-bold">
            <IconMessages className="text-foreground size-4 shrink-0" />
            <ReadChatApprovalTarget chatId={input?.chatId} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              Deny
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              Approve
            </Button>
          </div>
        </div>
      );
    case "output-denied":
      return (
        <div
          key={callId}
          className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
        >
          <IconCircleX className="size-4 shrink-0" />
          Read chat denied
        </div>
      );
    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false)
        return (
          <div
            key={callId}
            className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            Read chat denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>Reading chat</span>
        </div>
      );
    }
    case "output-available": {
      const output = part.output as ReadChatOutput | undefined;
      const chatId = output?.chatId ?? input?.chatId;
      const title = output?.title || "Untitled chat";
      const start = output?.start ?? 0;
      const end = output?.end ?? 0;
      const total = output?.transcriptChars ?? 0;
      const rangeLabel =
        start === 0 && end >= total
          ? "Read all of"
          : `Read characters ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} from`;
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconMessages className="size-4 shrink-0" />
          <span className="flex max-w-2xl min-w-0 gap-1 tabular-nums">
            <span className="shrink-0">{rangeLabel}</span>
            {output?.isCurrent ? (
              <span className="truncate">this chat</span>
            ) : chatId ? (
              <Link to={`/chat/${chatId}`} className="truncate hover:underline">
                {title}
              </Link>
            ) : (
              <span className="truncate">{title}</span>
            )}
          </span>
        </div>
      );
    }
    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL)
        return (
          <div
            key={callId}
            className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            Cancelled
          </div>
        );
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorOpen}
          onOpenChange={setIsErrorOpen}
          title="Error reading chat"
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconMessages className="size-4 shrink-0" />
          Read chat accessed
        </div>
      );
  }
};

MessagePartToolReadChat.displayName = "MessagePartToolReadChat";
