import {
  IconSettings,
  IconCircleX,
  IconX,
  IconCircleCheck,
  IconChevronDown,
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

interface GetSettingInput {
  key: string;
}

interface GetSettingOutput {
  key: string;
  type: string;
  options: unknown[] | null;
  value: unknown;
}

export const MessagePartToolGetSetting = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = part.input as GetSettingInput;
  const approvalHandler = useChatApprovalHandler();
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean | undefined>();

  const key = input?.key || "unknown setting";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconSettings className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to get setting "{key}"
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
            Get setting denied ({key})
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
          <span className="max-w-2xl truncate">Getting setting "{key}"...</span>
        </div>
      );

    case "output-available": {
      const output = part.output as GetSettingOutput;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsAccordionOpen(value === callId)}
          className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/get-setting-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconSettings
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/get-setting-accordion:scale-0 group-hover/get-setting-accordion:opacity-0",
                      isAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/get-setting-accordion:scale-100 group-hover/get-setting-accordion:opacity-100",
                      isAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">Retrieved setting "{key}"</span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 p-0 pt-2">
              <div className="flex gap-4">
                <div>
                  <span className="text-muted-foreground block text-xs">Current Value:</span>
                  <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-sm font-bold">
                    {JSON.stringify(output?.value)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Type:</span>
                  <span className="bg-muted rounded-md px-2 py-0.5 font-mono text-xs">
                    {output?.type}
                  </span>
                </div>
              </div>
              {output?.options ? (
                <div>
                  <span className="text-muted-foreground mb-1 block text-xs">
                    Available Options:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {output.options.map((opt) => (
                      <span
                        key={String(opt)}
                        className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 font-mono text-xs"
                      >
                        {JSON.stringify(opt)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">Get setting cancelled</span>
          </div>
        );
      }
      return (
        <div key={callId} className="text-destructive flex items-center gap-1 text-sm font-bold">
          <IconCircleX className="size-4 shrink-0" />
          <span>Error getting setting: {part.errorText}</span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconSettings className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Get setting accessed</span>
        </div>
      );
  }
};

MessagePartToolGetSetting.displayName = "MessagePartToolGetSetting";
