import { IconCircleCheck, IconCircleX, IconTool, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ToolCallPartProps {
  part: ToolUIPart;
}

export const MessagePartToolCall = ({ part }: ToolCallPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const toolName = getToolDisplayName(part.type.replace("tool-", ""), part.title);
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconTool className="text-foreground size-4" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToRunNamedTool", { name: toolName })}
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
          <IconCircleX className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm font-bold">
            {t("tools.toolDenied", { name: toolName })}
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-2">
          <Spinner className="text-destructive" />
          <span className="text-destructive text-sm font-bold">
            {t("tools.runningUnknownTool", { name: toolName })}
          </span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.toolDenied", { name: toolName })}
            </span>
          </div>
        );
      }
      return (
        <Accordion type="single" collapsible className="bg-secondary my-1 w-full rounded-md">
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <Spinner className="text-destructive" />
                <span className="max-w-2xl truncate">
                  {t("tools.runningUnknownTool", { name: toolName })}
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              {part.input && typeof part.input === "object" ? (
                <div className="text-foreground/80 text-xs">
                  <span className="font-medium">{t("common.parametersColon")}</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-transparent p-2 text-xs">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-available":
      return (
        <Accordion type="single" collapsible className="bg-secondary my-1 w-full rounded-md">
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <IconCircleX className="text-destructive" />
                <span className="max-w-2xl truncate">
                  {t("tools.unknownToolFinished", { name: toolName })}
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              <div className="text-foreground/80 text-sm">
                <div className="whitespace-pre-wrap">
                  {t("tools.toolOutput")}{" "}
                  {typeof part.output === "string"
                    ? part.output
                    : JSON.stringify(part.output, null, 2)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-2">
            <IconCircleX className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.toolCancelled", { name: toolName })}
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
          title={t("tools.unknownToolError", { name: toolName })}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-2">
          <IconCircleX className="text-destructive size-4" />
          <span className="text-destructive text-sm font-bold">
            {t("tools.unknownTool", { name: toolName })}
          </span>
        </div>
      );
  }
};

MessagePartToolCall.displayName = "MessagePartToolCall";
