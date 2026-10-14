import { IconArrowsMinimize, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import type { CompactionPart } from "@/lib/ai/compaction";
import { cn } from "@/lib/utils";

const accordionValue = "compaction";

export const MessagePartCompaction = ({
  part,
  isLastMessage,
}: {
  part: CompactionPart;
  isLastMessage?: boolean;
}) => {
  const { status } = useChatStatus();
  const [isOpen, setIsOpen] = useState(false);
  const isBusy = isLastMessage && (status === "streaming" || status === "submitted");

  if (part.data.status !== "done") {
    if (!isBusy) return null;

    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Separator className="flex-1" />
        <span className="flex items-center gap-1">
          <Spinner />
          Compacting conversation...
        </span>
        <Separator className="flex-1" />
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) => setIsOpen(value === accordionValue)}
      className="bg-transparent p-0 text-sm"
    >
      <AccordionItem value={accordionValue} className="group/compaction-accordion border-0">
        <AccordionTrigger className="text-muted-foreground items-center gap-2 rounded-none p-0 hover:no-underline">
          <span aria-hidden className="relative flex-1 self-stretch">
            <span
              className={cn(
                "border-border absolute inset-x-0 top-1/2 bottom-0 border-t border-l border-l-transparent transition-[border-color,border-radius] duration-300",
                isOpen && "border-l-border rounded-tl-md duration-0",
              )}
            />
          </span>
          <span className="flex items-center gap-1">
            <span className="relative size-4 shrink-0">
              <IconArrowsMinimize
                className={cn(
                  "absolute inset-0 size-4 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/compaction-accordion:scale-0 group-hover/compaction-accordion:opacity-0",
                  isOpen && "scale-0 opacity-0",
                )}
              />
              <IconChevronDown
                className={cn(
                  "absolute inset-0 size-4 scale-0 opacity-0 transition-[opacity,scale,rotate] duration-200 group-hover/compaction-accordion:scale-100 group-hover/compaction-accordion:opacity-100",
                  isOpen && "scale-100 rotate-180 opacity-100",
                )}
              />
            </span>
            Conversation compacted
          </span>
          <span aria-hidden className="relative flex-1 self-stretch">
            <span
              className={cn(
                "border-border absolute inset-x-0 top-1/2 bottom-0 border-t border-r border-r-transparent transition-[border-color,border-radius] duration-300",
                isOpen && "border-r-border rounded-tr-md duration-0",
              )}
            />
          </span>
        </AccordionTrigger>
        <AccordionContent className="prose dark:prose-invert prose-sm prose-neutral prose-quoteless max-h-96 max-w-full overflow-auto rounded-b-md border border-t-0 p-2 text-base">
          <MemoizedMarkdown
            id={part.id}
            content={part.data.summary ?? ""}
            messageRole="assistant"
            simpleCodeBlocks
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
