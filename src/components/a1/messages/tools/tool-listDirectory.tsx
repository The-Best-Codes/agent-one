import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconFile,
  IconFolder,
  IconFolderOpen,
  IconLink,
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

interface ListDirectoryInput {
  dirPath: string;
  includeDetails?: boolean;
  limit?: number;
}

interface DirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  size?: number;
  modifiedAt?: string;
}

interface ListDirectoryOutput {
  success: boolean;
  dirPath?: string;
  totalEntries?: number;
  returnedEntries?: number;
  truncated?: boolean;
  entries?: DirEntry[];
  error?: string;
}

interface ListDirectoryToolPartProps {
  part: ToolUIPart;
}

const formatFilePath = (filePath: string) => {
  const parts = filePath.split("/");
  if (parts.length <= 3) return filePath;
  return "…/" + parts.slice(-2).join("/");
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const EntryIcon = memo(({ entry }: { entry: DirEntry }) => {
  if (entry.isSymlink) return <IconLink className="text-muted-foreground size-3.5 shrink-0" />;
  if (entry.isDirectory) return <IconFolder className="size-3.5 shrink-0 text-blue-400" />;
  return <IconFile className="text-muted-foreground size-3.5 shrink-0" />;
});

EntryIcon.displayName = "EntryIcon";

export const MessagePartToolListDirectory = ({ part }: ListDirectoryToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as ListDirectoryInput;
  const output = part.output as ListDirectoryOutput;
  const { addToolApprovalResponse } = useChatFunctions();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const dirPath = input?.dirPath || "unknown directory";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconFolderOpen className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to list{" "}
              <span className="font-mono text-xs">{formatFilePath(dirPath)}</span>
            </span>
          </div>
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
            Directory listing denied ({formatFilePath(dirPath)})
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconLoader className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="text-foreground text-sm font-bold">Preparing to list directory...</span>
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
            Listing <span className="font-mono text-xs">{formatFilePath(dirPath)}</span>...
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
            <span className="max-w-2xl truncate">Failed to list {formatFilePath(dirPath)}</span>
          </div>
        );
      }

      const entries = output.entries || [];

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
              "group/list-dir-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconFolderOpen
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/list-dir-accordion:scale-0 group-hover/list-dir-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/list-dir-accordion:scale-100 group-hover/list-dir-accordion:opacity-100",
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
                Listed <span className="font-mono text-xs">{formatFilePath(dirPath)}</span> (
                {output.totalEntries} entries{output.truncated ? ", truncated" : ""})
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <ScrollArea type="always" viewportClassName="max-h-72">
                <div className="flex flex-col font-mono text-xs">
                  {entries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 py-0.5">
                      <EntryIcon entry={entry} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          entry.isDirectory && "text-blue-400",
                        )}
                      >
                        {entry.name}
                        {entry.isDirectory ? "/" : ""}
                      </span>
                      {entry.size !== undefined && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {formatSize(entry.size)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
            <span className="text-muted-foreground text-sm font-bold">
              Directory listing cancelled
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
              "group/list-dir-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/list-dir-accordion:scale-0 group-hover/list-dir-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/list-dir-accordion:scale-100 group-hover/list-dir-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Error listing directory</span>
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
          <IconFolderOpen className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Directory listed</span>
        </div>
      );
  }
};

MessagePartToolListDirectory.displayName = "MessagePartToolListDirectory";
