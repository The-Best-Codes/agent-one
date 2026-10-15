import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconMessageSearch,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface SearchChatsInput {
  query?: string;
}

interface SearchChatsResult {
  chatId: string;
  title?: string;
  snippet?: string;
  isCurrent?: boolean;
}

const parseResults = (output: unknown): SearchChatsResult[] => {
  if (
    output &&
    typeof output === "object" &&
    Array.isArray((output as { results?: unknown }).results)
  )
    return (output as { results: SearchChatsResult[] }).results;
  return [];
};

export const MessagePartToolSearchChats = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = part.input as SearchChatsInput | undefined;
  const approvalHandler = useChatApprovalHandler();
  const [isMainOpen, setIsMainOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const query = input?.query?.trim();
  const actionLabel = query ? `search chats for "${query}"` : "list recent chats";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1 text-sm font-bold">
            <IconMessageSearch className="text-foreground size-4 shrink-0" />
            <span className="max-w-2xl truncate">{`AgentOne wants to ${actionLabel}`}</span>
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
          Search chats denied
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
            Search chats denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            {query ? `Searching chats for "${query}"` : "Listing recent chats"}
          </span>
        </div>
      );
    }
    case "output-available": {
      const results = parseResults(part.output);
      if (results.length === 0)
        return (
          <div key={callId} className="flex items-center gap-1 text-sm font-bold">
            <IconMessageSearch className="size-4 shrink-0" />
            <span className="max-w-2xl truncate">
              {query ? `No chats found for "${query}"` : "No chats found"}
            </span>
          </div>
        );
      return (
        <Accordion
          key={callId}
          type="single"
          collapsible
          value={isMainOpen ? callId : ""}
          onValueChange={(value) => setIsMainOpen(value === callId)}
          className="flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/chat-search border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainOpen && "border border-b! w-full max-w-2xl p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconMessageSearch
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/chat-search:scale-0 group-hover/chat-search:opacity-0",
                      isMainOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/chat-search:scale-100 group-hover/chat-search:opacity-100",
                      isMainOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate tabular-nums">
                {query
                  ? `Found ${results.length} chat${results.length === 1 ? "" : "s"} for "${query}"`
                  : `Listed ${results.length} recent chat${results.length === 1 ? "" : "s"}`}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="flex flex-col gap-2">
                {results.map((result) => (
                  <div key={result.chatId} className="flex min-w-0 flex-col">
                    <Link
                      to={`/chat/${result.chatId}`}
                      className="text-foreground truncate text-sm font-bold hover:underline"
                    >
                      {result.title || "Untitled chat"}
                      {result.isCurrent ? " (this chat)" : ""}
                    </Link>
                    {result.snippet ? (
                      <span className="text-muted-foreground line-clamp-2 text-xs">
                        {result.snippet}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
          title="Error searching chats"
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconMessageSearch className="size-4 shrink-0" />
          Search chats accessed
        </div>
      );
  }
};

MessagePartToolSearchChats.displayName = "MessagePartToolSearchChats";
