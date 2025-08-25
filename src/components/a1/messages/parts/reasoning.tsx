import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { cn } from "@/lib/utils";
import type { ReasoningUIPart } from "ai";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

export const MessagePartReasoning = ({
  text,
}: {
  text: ReasoningUIPart["text"];
}) => {
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<
    boolean | undefined
  >();

  const accordionValue = "reasoning";

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) =>
        setIsMainAccordionOpen(value === accordionValue)
      }
      className="text-foreground flex flex-row bg-transparent p-0 text-sm"
    >
      <AccordionItem
        value={accordionValue}
        className={cn(
          "group/reasoning-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
          isMainAccordionOpen && "border-1 !border-b-1 p-2",
        )}
      >
        <AccordionTrigger
          icon={
            <div className="relative">
              <BrainIcon
                className={cn(
                  "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/reasoning-accordion:scale-0 group-hover/reasoning-accordion:opacity-0",
                  isMainAccordionOpen && "scale-0 opacity-0",
                )}
              />
              <ChevronDownIcon
                className={cn(
                  "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/reasoning-accordion:scale-100 group-hover/reasoning-accordion:opacity-100",
                  isMainAccordionOpen && "scale-100 opacity-100",
                )}
              />
            </div>
          }
          iconPosition="left"
          shouldRotateIcon={true}
          className="justify-start gap-1 p-0 font-bold hover:no-underline"
        >
          <span className="max-w-2xl truncate">Reasoning</span>
        </AccordionTrigger>
        <AccordionContent className="prose dark:prose-invert prose-sm prose-neutral prose-code:select-all p-0 pt-2 text-base">
          <pre>{text}</pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
