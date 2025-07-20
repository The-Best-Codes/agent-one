import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ReasoningUIPart } from "ai";

export const MessagePartReasoning = ({
  text,
}: {
  text: ReasoningUIPart["text"];
}) => {
  return (
    <div className="max-w-full rounded-md">
      <Accordion type="single" collapsible>
        <AccordionItem value="reasoning">
          <AccordionTrigger className="w-fit py-2">Reasoning</AccordionTrigger>
          <AccordionContent className="prose dark:prose-invert prose-sm text-base prose-neutral prose-code:select-all">
            <pre>{text}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
