import { IconSettings, IconCircleX, IconX, IconCircleCheck } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

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
  const callId = part.toolCallId;
  const input = part.input as UpdateSettingInput;
  const approvalHandler = useChatApprovalHandler();

  const key = input?.key || "unknown setting";
  const value = input?.value !== undefined ? JSON.stringify(input.value) : "undefined";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconSettings className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to update setting "{key}" to "{value}"
            </span>
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
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">
            Update setting denied ({key})
          </span>
        </div>
      );

    case "input-streaming":
    case "approval-responded":
    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Updating setting "{key}" to "{value}"...
          </span>
        </div>
      );

    case "output-available": {
      const output = part.output as UpdateSettingOutput;

      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1.5 text-sm font-bold"
        >
          <IconCircleCheck className="size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Updated setting "{key}" to "{JSON.stringify(output?.value)}"
          </span>
        </div>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Update setting cancelled
            </span>
          </div>
        );
      }
      return (
        <div key={callId} className="text-destructive flex items-center gap-1 text-sm font-bold">
          <IconCircleX className="size-4 shrink-0" />
          <span>Error updating setting: {part.errorText}</span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconSettings className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Update setting accessed</span>
        </div>
      );
  }
};

MessagePartToolUpdateSetting.displayName = "MessagePartToolUpdateSetting";
