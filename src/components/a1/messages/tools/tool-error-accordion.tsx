import { IconChevronDown, IconCircleX } from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { cn } from "@/lib/utils";

interface ToolErrorAccordionProps {
  callId: string;
  errorText?: string;
  isOpen: boolean | undefined;
  onOpenChange: (isOpen: boolean) => void;
  title: React.ReactNode;
}

export function ToolErrorAccordion({
  callId,
  errorText,
  isOpen,
  onOpenChange,
  title,
}: ToolErrorAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) => onOpenChange(value === callId)}
      className="text-foreground flex flex-row bg-transparent p-0 text-sm"
    >
      <AccordionItem
        value={callId}
        className={cn(
          "group/tool-error-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
          isOpen && "border border-b! p-2",
        )}
      >
        <AccordionTrigger
          icon={
            <div className="relative">
              <IconCircleX
                className={cn(
                  "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/tool-error-accordion:scale-0 group-hover/tool-error-accordion:opacity-0",
                  isOpen && "scale-0 opacity-0",
                )}
              />
              <IconChevronDown
                className={cn(
                  "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/tool-error-accordion:scale-100 group-hover/tool-error-accordion:opacity-100",
                  isOpen && "scale-100 opacity-100",
                )}
              />
            </div>
          }
          iconPosition="left"
          shouldRotateIcon={true}
          className="justify-start gap-1 p-0 font-bold hover:no-underline"
        >
          <span className="text-destructive max-w-2xl truncate">{title}</span>
        </AccordionTrigger>
        <AccordionContent className="p-0 pt-2">
          <div className="text-destructive/80 text-sm font-normal">
            {errorText || "Unknown error"}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
