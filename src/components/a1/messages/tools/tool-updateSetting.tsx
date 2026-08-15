import {
  IconCircleX,
  IconCircleCheck,
  IconSettings,
  IconSettingsCheck,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface UpdateSettingInput {
  key: string;
  value: unknown;
}

interface UpdateSettingOutput {
  key: string;
  value: unknown;
  success: boolean;
}

export const MessagePartToolUpdateSetting = ({ part }: { part: ToolUIPart }) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as UpdateSettingInput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const key = input?.key || "unknown setting";
  const value = input?.value !== undefined ? JSON.stringify(input.value) : "undefined";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconSettings className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToUpdateSetting", { key, value })}
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
            Update "{key}" setting denied
          </span>
        </div>
      );

    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Update "{key}" setting denied
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
            Updating "{key}" setting to {value}...
          </span>
        </div>
      );
    }

    case "output-available": {
      const output = part.output as UpdateSettingOutput;

      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1.5 text-sm font-bold"
        >
          <IconSettingsCheck className="size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Updated "{key}" setting to {JSON.stringify(output?.value)}
          </span>
        </div>
      );
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Updating setting was cancelled
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
          title={t("tools.updateSettingError")}
        />
      );
    }

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconSettings className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            {t("tools.updateSettingAccessed")}
          </span>
        </div>
      );
  }
};

MessagePartToolUpdateSetting.displayName = "MessagePartToolUpdateSetting";
