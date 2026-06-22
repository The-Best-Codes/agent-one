import {
  IconChevronDown,
  IconCircleX,
  IconCircleCheck,
  IconSettings,
  IconSettingsCheck,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

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
              AgentOne wants to update "{key}" setting to {value}
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
            Update "{key}" setting denied
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
            Updating "{key}" setting to {value}...
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
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsErrorAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/update-setting-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/update-setting-accordion:scale-0 group-hover/update-setting-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/update-setting-accordion:scale-100 group-hover/update-setting-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Error updating setting</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-destructive/80 text-sm font-normal">
                {part?.errorText || "Unknown error"}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

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
