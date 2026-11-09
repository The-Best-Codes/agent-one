import { IconChevronDown, IconCircleX, IconPhotoSearch } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { MentionChip } from "@/components/a1/mention-chip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { parseChatMentionHref } from "@/lib/chat-mentions";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { getFileName } from "@/lib/file-icons";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface AnalyzeFileInput {
  path?: string;
  prompt?: string;
}

interface AnalyzeFileOutput {
  name?: string;
  description?: string;
}

export const MessagePartToolAnalyzeFile = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = part.input as AnalyzeFileInput | undefined;
  const output = part.output as AnalyzeFileOutput | undefined;
  const [isOpen, setIsOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const path = input?.path?.trim();
  const mention = parseChatMentionHref(path);
  const filePath = mention?.kind === "attachment" ? mention.path : path;
  const name = output?.name ?? (filePath ? getFileName(filePath) : "");

  switch (part.state) {
    case "input-streaming":
    case "input-available":
    case "approval-requested":
    case "approval-responded":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground truncate text-sm font-bold">
            {name ? `Analyzing ${name}...` : "Analyzing a file..."}
          </span>
        </div>
      );

    case "output-available":
      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsOpen(value === callId)}
          className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/analyze-file-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconPhotoSearch
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/analyze-file-accordion:scale-0 group-hover/analyze-file-accordion:opacity-0",
                      isOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/analyze-file-accordion:scale-100 group-hover/analyze-file-accordion:opacity-100",
                      isOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">{`Analyzed ${name}`}</span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 p-0 pt-2">
              {filePath && (
                <div>
                  <MentionChip mention={{ kind: "attachment", path: filePath }} />
                </div>
              )}
              {input?.prompt && (
                <div className="text-muted-foreground text-xs whitespace-pre-wrap">
                  {input.prompt}
                </div>
              )}
              <div className="bg-muted/40 max-h-72 overflow-auto rounded-sm border p-2 text-sm whitespace-pre-wrap">
                {output?.description || "No description was returned."}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Analyzing the file was cancelled
            </span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorOpen}
          onOpenChange={setIsErrorOpen}
          title={`Couldn't analyze ${name}`}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconPhotoSearch className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{`Analyzed ${name}`}</span>
        </div>
      );
  }
};

MessagePartToolAnalyzeFile.displayName = "MessagePartToolAnalyzeFile";
