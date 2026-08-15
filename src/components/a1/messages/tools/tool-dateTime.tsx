import { IconCalendar, IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface DateTimeOutput {
  dateTime: string;
  formatted: string;
}

interface DateTimeToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolDateTime = ({ part }: DateTimeToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const output = part.output as DateTimeOutput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconCalendar className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToCheckDateTime")}
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
            Time and date check denied
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Spinner className="text-foreground size-4 shrink-0" />
          </div>
          <span className="text-foreground text-sm font-bold">{t("tools.checkingTimeDate")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Time and date check denied
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
          <span className="max-w-2xl truncate">{t("tools.checkingTimeDate")}</span>
        </div>
      );
    }

    case "output-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <IconCalendar className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            {t("tools.checkedTimeDate", { formatted: output?.formatted })}
          </span>
        </div>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Time and date check cancelled
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
          title={t("tools.dateTimeError")}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCalendar className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.timeDateAccessed")}</span>
        </div>
      );
  }
};

MessagePartToolDateTime.displayName = "MessagePartToolDateTime";
