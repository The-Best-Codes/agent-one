import { IconChevronDown, IconFold } from "@tabler/icons-react";
import { useState } from "react";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { cn } from "@/lib/utils";

export const MessagePartCompaction = ({ id, summary }: { id: string; summary: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const accordionValue = "compaction";

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) => setIsOpen(value === accordionValue)}
      className="text-muted-foreground flex flex-row bg-transparent p-0 text-sm"
    >
      <AccordionItem
        value={accordionValue}
        className={cn(
          "group/compaction-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
          isOpen && "border border-b! p-2",
        )}
      >
        <AccordionTrigger
          icon={
            <div className="relative">
              <IconFold
                className={cn(
                  "absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/compaction-accordion:scale-0 group-hover/compaction-accordion:opacity-0",
                  isOpen && "scale-0 opacity-0",
                )}
              />
              <IconChevronDown
                className={cn(
                  "absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/compaction-accordion:scale-100 group-hover/compaction-accordion:opacity-100",
                  isOpen && "scale-100 opacity-100",
                )}
              />
            </div>
          }
          iconPosition="left"
          shouldRotateIcon={true}
          className="justify-start gap-1 p-0 font-bold hover:no-underline"
        >
          <span className="max-w-2xl truncate">Earlier messages were summarized</span>
        </AccordionTrigger>
        <AccordionContent className="prose dark:prose-invert prose-sm prose-neutral prose-quoteless text-foreground max-h-96 max-w-full overflow-auto p-0 pt-2 text-base">
          <MemoizedMarkdown
            id={`${id}-compaction`}
            content={summary}
            messageRole="assistant"
            simpleCodeBlocks
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
