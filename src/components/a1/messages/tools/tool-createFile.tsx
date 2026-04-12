import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconFilePlus,
  IconLoader,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { memo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CreateFileInput {
  filePath: string;
  content: string;
  overwrite?: boolean;
}

interface CreateFileOutput {
  success: boolean;
  filePath: string;
  bytesWritten?: number;
  overwritten?: boolean;
  content?: string;
  error?: string;
}

interface CreateFileToolPartProps {
  part: ToolUIPart;
}

const formatFilePath = (filePath: string) => {
  const parts = filePath.split("/");
  if (parts.length <= 3) return filePath;
  return "…/" + parts.slice(-2).join("/");
};

const ContentPreview = memo(({ content }: { content: string }) => {
  const lines = content.split("\n");

  return (
    <ScrollArea type="always" viewportClassName="max-h-72">
      <div className="font-mono text-xs leading-relaxed">
        {lines.map((line, index) => (
          <div key={index} className="flex bg-green-500/10 whitespace-pre text-green-400">
            <span className="text-muted-foreground/50 w-8 shrink-0 pr-1 text-right select-none">
              {index + 1}
            </span>
            <span className="w-4 shrink-0 text-center select-none">+</span>
            <span className="min-w-0 flex-1 overflow-hidden">{line}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
});

ContentPreview.displayName = "ContentPreview";

export const MessagePartToolCreateFile = ({ part }: CreateFileToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as CreateFileInput;
  const output = part.output as CreateFileOutput;
  const { addToolApprovalResponse } = useChatFunctions();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const filePath = input?.filePath || "unknown file";

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconFilePlus className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to {input?.overwrite ? "overwrite" : "create"}{" "}
              <span className="font-mono text-xs">{formatFilePath(filePath)}</span>
            </span>
          </div>
          {input?.content && (
            <div className="border-border overflow-hidden rounded border">
              <ContentPreview content={input.content} />
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: false,
                })
              }
            >
              <IconX data-icon="inline-start" />
              Deny
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: true,
                })
              }
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
            File creation denied ({formatFilePath(filePath)})
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconLoader className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="text-foreground text-sm font-bold">Preparing to create file...</span>
        </div>
      );

    case "approval-responded":
    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <IconLoader className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="max-w-2xl truncate">
            Creating <span className="font-mono text-xs">{formatFilePath(filePath)}</span>...
          </span>
        </div>
      );

    case "output-available": {
      if (!output?.success) {
        return (
          <div
            key={callId}
            className="text-destructive flex flex-row items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            <span className="max-w-2xl truncate">Failed to create {formatFilePath(filePath)}</span>
          </div>
        );
      }

      const content = output.content || input?.content;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/create-file-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconFilePlus
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-0 group-hover/create-file-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-100 group-hover/create-file-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">
                {output.overwritten ? "Overwrote" : "Created"}{" "}
                <span className="font-mono text-xs">{formatFilePath(filePath)}</span>
                {output.bytesWritten ? ` (${output.bytesWritten.toLocaleString()} bytes)` : ""}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              {content ? (
                <div className="border-border overflow-hidden rounded border">
                  <ContentPreview content={content} />
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">File created successfully.</div>
              )}
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
            <span className="text-muted-foreground text-sm font-bold">File creation cancelled</span>
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
              "group/create-file-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-0 group-hover/create-file-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-100 group-hover/create-file-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Error creating file</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-destructive/80 text-sm font-normal">
                {part?.errorText || "Unknown error"}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconFilePlus className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">File created</span>
        </div>
      );
  }
};

MessagePartToolCreateFile.displayName = "MessagePartToolCreateFile";
