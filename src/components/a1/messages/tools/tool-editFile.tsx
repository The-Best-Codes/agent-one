import { unifiedMergeView } from "@codemirror/merge";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import type { ToolUIPart } from "ai";
import { memo, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { useTheme } from "@/hooks/use-theme";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { getLanguageExtension } from "@/lib/syntax-highlighter/language-extensions";
import { cn } from "@/lib/utils";

interface EditFileInput {
  filePath: string;
  oldContent: string;
  newContent: string;
}

interface EditFileOutput {
  filePath: string;
  linesChanged?: number;
}

interface EditFileToolPartProps {
  part: ToolUIPart;
}

const DiffView = memo(
  ({
    oldContent,
    newContent,
    filePath,
  }: {
    oldContent: string;
    newContent: string;
    filePath: string;
  }) => {
    const { resolvedTheme } = useTheme();
    const [langExt, setLangExt] = useState<Extension | null>(null);

    useEffect(() => {
      getLanguageExtension(filePath).then(setLangExt);
    }, [filePath]);

    return (
      <div className="max-h-72 w-full overflow-auto">
        <CodeMirror
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          value={newContent}
          className="w-full"
          extensions={[
            unifiedMergeView({
              original: oldContent,
              highlightChanges: true,
              gutter: true,
              mergeControls: false,
              collapseUnchanged: { margin: 3, minSize: 4 },
            }),
            EditorView.editable.of(false),
            ...(langExt ? [langExt] : []),
          ]}
          readOnly={true}
        />
      </div>
    );
  },
);

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
              AgentOne wants to edit <span className="font-mono text-xs">{filePath}</span>
            </span>
          </div>
          {input?.oldContent && input?.newContent && (
            <div className="border-border overflow-hidden rounded border">
              <DiffView
                oldContent={input.oldContent}
                newContent={input.newContent}
                filePath={filePath}
              />
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
          <span className="text-muted-foreground text-sm font-bold">Edit denied ({filePath})</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
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
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Editing <span className="font-mono text-xs">{filePath}</span>...
          </span>
        </div>
      );

    case "output-available": {
      const oldContent = input?.oldContent;
      const newContent = input?.newContent;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/edit-file-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
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
                Edited <span className="font-mono text-xs">{filePath}</span>
                {output.linesChanged ? ` (${output.linesChanged} lines)` : ""}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              {oldContent && newContent ? (
                <div className="border-border w-full overflow-hidden rounded border">
                  <DiffView oldContent={oldContent} newContent={newContent} filePath={filePath} />
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
