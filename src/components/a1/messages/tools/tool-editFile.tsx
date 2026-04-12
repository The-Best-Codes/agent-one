import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconLoader,
  IconPencil,
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

interface EditFileInput {
  filePath: string;
  oldContent: string;
  newContent: string;
}

interface EditFileOutput {
  success: boolean;
  filePath: string;
  linesChanged?: number;
  oldContent?: string;
  newContent?: string;
  error?: string;
}

interface EditFileToolPartProps {
  part: ToolUIPart;
}

const formatFilePath = (filePath: string) => {
  const parts = filePath.split("/");
  if (parts.length <= 3) return filePath;
  return "…/" + parts.slice(-2).join("/");
};

interface DiffLine {
  type: "added" | "removed" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

function computeDiffLines(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const lines: DiffLine[] = [];

  const maxContext = 3;

  // Simple diff: find common prefix, differing middle, common suffix
  let prefixLen = 0;
  while (
    prefixLen < oldLines.length &&
    prefixLen < newLines.length &&
    oldLines[prefixLen] === newLines[prefixLen]
  ) {
    prefixLen++;
  }

  let oldSuffixStart = oldLines.length;
  let newSuffixStart = newLines.length;
  while (
    oldSuffixStart > prefixLen &&
    newSuffixStart > prefixLen &&
    oldLines[oldSuffixStart - 1] === newLines[newSuffixStart - 1]
  ) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  // Context before changes
  const contextStart = Math.max(0, prefixLen - maxContext);
  for (let i = contextStart; i < prefixLen; i++) {
    lines.push({
      type: "context",
      content: oldLines[i],
      oldLineNumber: i + 1,
      newLineNumber: i + 1,
    });
  }

  // Removed lines
  for (let i = prefixLen; i < oldSuffixStart; i++) {
    lines.push({
      type: "removed",
      content: oldLines[i],
      oldLineNumber: i + 1,
    });
  }

  // Added lines
  for (let i = prefixLen; i < newSuffixStart; i++) {
    lines.push({
      type: "added",
      content: newLines[i],
      newLineNumber: i + 1,
    });
  }

  // Context after changes
  const contextEnd = Math.min(oldLines.length, oldSuffixStart + maxContext);
  for (let i = oldSuffixStart; i < contextEnd; i++) {
    const newI = i - oldSuffixStart + newSuffixStart;
    lines.push({
      type: "context",
      content: oldLines[i],
      oldLineNumber: i + 1,
      newLineNumber: newI + 1,
    });
  }

  return lines;
}

const DiffView = memo(({ oldContent, newContent }: { oldContent: string; newContent: string }) => {
  const diffLines = computeDiffLines(oldContent, newContent);

  if (diffLines.length === 0) {
    return <div className="text-muted-foreground p-2 text-xs italic">No visible changes</div>;
  }

  return (
    <ScrollArea type="always" viewportClassName="max-h-72">
      <div className="font-mono text-xs leading-relaxed">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={cn(
              "flex whitespace-pre",
              line.type === "removed" && "bg-red-500/10 text-red-400",
              line.type === "added" && "bg-green-500/10 text-green-400",
              line.type === "context" && "text-muted-foreground",
            )}
          >
            <span className="text-muted-foreground/50 w-8 shrink-0 pr-1 text-right select-none">
              {line.oldLineNumber ?? " "}
            </span>
            <span className="text-muted-foreground/50 w-8 shrink-0 pr-1 text-right select-none">
              {line.newLineNumber ?? " "}
            </span>
            <span className="w-4 shrink-0 text-center select-none">
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            <span className="min-w-0 flex-1 overflow-hidden">{line.content}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
});

DiffView.displayName = "DiffView";

export const MessagePartToolEditFile = ({ part }: EditFileToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as EditFileInput;
  const output = part.output as EditFileOutput;
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
            <IconPencil className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to edit{" "}
              <span className="font-mono text-xs">{formatFilePath(filePath)}</span>
            </span>
          </div>
          {input?.oldContent && input?.newContent && (
            <div className="border-border overflow-hidden rounded border">
              <DiffView oldContent={input.oldContent} newContent={input.newContent} />
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
            Edit denied ({formatFilePath(filePath)})
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconLoader className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="text-foreground text-sm font-bold">Preparing file edit...</span>
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
            Editing <span className="font-mono text-xs">{formatFilePath(filePath)}</span>...
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
            <span className="max-w-2xl truncate">Failed to edit {formatFilePath(filePath)}</span>
          </div>
        );
      }

      const oldContent = output.oldContent || input?.oldContent;
      const newContent = output.newContent || input?.newContent;

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
              "group/edit-file-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconPencil
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/edit-file-accordion:scale-0 group-hover/edit-file-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/edit-file-accordion:scale-100 group-hover/edit-file-accordion:opacity-100",
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
                Edited <span className="font-mono text-xs">{formatFilePath(filePath)}</span>
                {output.linesChanged ? ` (${output.linesChanged} lines)` : ""}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              {oldContent && newContent ? (
                <div className="border-border overflow-hidden rounded border">
                  <DiffView oldContent={oldContent} newContent={newContent} />
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">File edited successfully.</div>
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
            <span className="text-muted-foreground text-sm font-bold">File edit cancelled</span>
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
              "group/edit-file-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/edit-file-accordion:scale-0 group-hover/edit-file-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/edit-file-accordion:scale-100 group-hover/edit-file-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Error editing file</span>
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
          <IconPencil className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">File edited</span>
        </div>
      );
  }
};

MessagePartToolEditFile.displayName = "MessagePartToolEditFile";
