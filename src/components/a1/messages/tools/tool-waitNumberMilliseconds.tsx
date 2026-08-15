import { IconCircleCheck, IconCircleX, IconClock, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { getLogger } from "@/lib/logger";

import { ToolErrorAccordion } from "./tool-error-accordion";

const logger = getLogger(import.meta.url);

interface WaitNumberMillisecondsInput {
  milliseconds: number;
}

interface WaitNumberMillisecondsToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolWaitNumberMilliseconds = ({
  part,
}: WaitNumberMillisecondsToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as WaitNumberMillisecondsInput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const safeFormatMilliseconds = (milliseconds: number) => {
    try {
      if (isNaN(milliseconds) || milliseconds < 0) {
        return t("common.unknown");
      }

      const totalSeconds = Math.floor(milliseconds / 1000);
      const remainingMilliseconds = milliseconds % 1000;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;

      const formatted = [];

      if (totalMinutes > 0) formatted.push(`${totalMinutes}m`);
      if (remainingSeconds > 0) formatted.push(`${remainingSeconds}s`);
      if (remainingMilliseconds > 0 || formatted.length === 0)
        formatted.push(`${remainingMilliseconds}ms`);

      return formatted.join(" ");
    } catch (error) {
      logger.error(error);
      return t("common.unknown");
    }
  };

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconClock className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToWait", { duration: safeFormatMilliseconds(input?.milliseconds) })}
            </span>
          </div>
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
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">
            {t("tools.waitDenied", { duration: safeFormatMilliseconds(input?.milliseconds) })}
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Spinner className="text-foreground size-4 shrink-0" />
          </div>
          <span className="text-foreground text-sm font-bold">{t("tools.waiting")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.waitDenied", { duration: safeFormatMilliseconds(input?.milliseconds) })}
            </span>
          </div>
        );
      }
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            {t("tools.waitingDuration", { duration: safeFormatMilliseconds(input?.milliseconds) })}
          </span>
        </div>
      );
    }

    case "output-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <IconClock className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            {t("tools.waitedDuration", { duration: safeFormatMilliseconds(input?.milliseconds) })}
          </span>
        </div>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.waitCancelled")}
            </span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title={t("tools.waitError")}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconClock className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.waitAccessed")}</span>
        </div>
      );
  }
};

MessagePartToolWaitNumberMilliseconds.displayName = "MessagePartToolWaitNumberMilliseconds";
