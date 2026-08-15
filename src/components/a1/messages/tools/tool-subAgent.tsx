import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconHierarchy3,
  IconHourglassHigh,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { ChatApprovalHandlerContext } from "@/contexts/use-chat/chat-contexts";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import {
  getSubAgentLiveState,
  respondToSubAgentApproval,
  subscribeSubAgentLiveState,
  type SubAgentInput,
  type SubAgentOutput,
} from "@/lib/ai/tools/subAgent";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { SubagentTranscript } from "../parts/subagent-transcript";
import { ToolErrorAccordion } from "./tool-error-accordion";

interface SubAgentToolPartProps {
  part: ToolUIPart;
}

function getDisplayedMessage(part: ToolUIPart) {
  if (part.state === "output-available") {
    const output = part.output as SubAgentOutput | undefined;
    return output?.message;
  }

  return undefined;
}

export const MessagePartToolSubAgent = ({ part }: SubAgentToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as SubAgentInput | undefined;
  const approvalHandler = useChatApprovalHandler();
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const liveState = useSyncExternalStore(
    (listener) => subscribeSubAgentLiveState(callId, listener),
    () => getSubAgentLiveState(callId),
    () => getSubAgentLiveState(callId),
  );

  const task = input?.task || t("tools.unknownTask");
  const truncatedTask = task.length > 96 ? `${task.slice(0, 96)}...` : task;
  const displayedMessage = liveState?.message ?? getDisplayedMessage(part);
  const isStreaming =
    part.state === "output-available" && (part as { preliminary?: boolean }).preliminary === true;
  const pendingApprovals = liveState?.pendingApprovalIds ?? [];
  const hasPendingApprovals = pendingApprovals.length > 0;
  const isExpanded = Boolean(isAccordionOpen || hasPendingApprovals);
  const showSpinnerIcon = isStreaming;
  const nestedApprovalHandler = useCallback(
    async ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
      respondToSubAgentApproval(callId, id, approved, reason);
    },
    [callId],
  );

  const headerText = useMemo(() => {
    if (part.state === "output-denied") {
      return t("tools.subagentDenied");
    }
    if (part.state === "output-error") {
      return part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL
        ? t("tools.subagentCancelled")
        : t("tools.subagentError");
    }
    if (liveState?.status === "waiting-approval") {
      return t("tools.subagentWaiting", { count: pendingApprovals.length });
    }
    if (part.state === "approval-responded" && part.approval?.approved === false) {
      return t("tools.subagentDenied");
    }
    if (isStreaming || part.state === "approval-responded" || part.state === "input-available") {
      return t("tools.subagentRunning");
    }
    if (part.state === "output-available") {
      return t("tools.subagentFinished");
    }
    return t("tools.preparingSubagentShort");
  }, [isStreaming, liveState?.status, part, pendingApprovals.length, t]);

  switch (part.state) {
    case "approval-requested":
      return (
        <div className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconHierarchy3 className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToSpawnSubagent")}
            </span>
          </div>
          <div className="bg-secondary rounded px-2 py-1 text-xs wrap-break-word">{task}</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              {t("common.deny")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              {t("common.approve")}
            </Button>
          </div>
        </div>
      );

    case "output-denied":
      return (
        <div className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">{t("tools.subagentDenied")}</span>
        </div>
      );

    case "input-streaming":
      return (
        <div className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.preparingSubagent")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available":
    case "output-available": {
      if (part.approval?.approved === false) {
        return (
          <div className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">{t("tools.subagentDenied")}</span>
          </div>
        );
      }
      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsAccordionOpen(value === callId)}
          className="text-foreground flex w-full max-w-3xl flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/subagent-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isExpanded && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  {showSpinnerIcon ? (
                    <Spinner
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/subagent-accordion:scale-0 group-hover/subagent-accordion:opacity-0",
                        isExpanded && "scale-0 opacity-0",
                      )}
                    />
                  ) : (
                    <IconHierarchy3
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/subagent-accordion:scale-0 group-hover/subagent-accordion:opacity-0",
                        isExpanded && "scale-0 opacity-0",
                      )}
                    />
                  )}
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/subagent-accordion:scale-100 group-hover/subagent-accordion:opacity-100",
                      isExpanded && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">
                {headerText}: <code className="text-xs">{truncatedTask}</code>
              </span>
              {hasPendingApprovals && !isExpanded && (
                <span className="border-border text-muted-foreground ml-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
                  <IconHourglassHigh className="size-3 shrink-0" />
                  Approval needed
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="flex flex-col gap-3">
                <div className="text-muted-foreground text-xs">{t("tools.task", { task })}</div>
                {displayedMessage ? (
                  <ChatApprovalHandlerContext.Provider value={nestedApprovalHandler}>
                    <SubagentTranscript message={displayedMessage} />
                  </ChatApprovalHandlerContext.Provider>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">{t("tools.subagentCancelled")}</span>
          </div>
        );
      }

      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title={t("tools.subagentError")}
        />
      );

    default:
      return (
        <div className="flex items-center gap-1">
          <IconHierarchy3 className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.subagentExecuted")}</span>
        </div>
      );
  }
};

MessagePartToolSubAgent.displayName = "MessagePartToolSubAgent";
