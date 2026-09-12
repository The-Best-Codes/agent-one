import { IconBrain, IconChevronDown } from "@tabler/icons-react";
import type { ReasoningUIPart } from "ai";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { markdownRenderingAtom, maxMessageLengthAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

export const MessagePartReasoning = ({
  id,
  text,
  isBusy,
}: {
  id: string;
  text: ReasoningUIPart["text"];
  isBusy?: boolean;
}) => {
  const { status } = useChatStatus();
  const isLoading = isBusy && status === "streaming";

  const maxMessageLength = useAtomValue(maxMessageLengthAtom);
  const markdownRendering = useAtomValue(markdownRenderingAtom);
  const shouldUsePerformantRenderer = text.length > maxMessageLength;

  const shouldRenderMarkdown = (() => {
    if (markdownRendering === "both") return true;
    if (markdownRendering === "neither") return false;
    if (markdownRendering === "assistant") return true;
    return false;
  })();

  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();

  const accordionValue = "reasoning";

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) => setIsMainAccordionOpen(value === accordionValue)}
      className="text-foreground flex flex-row bg-transparent p-0 text-sm"
    >
      <AccordionItem
        value={accordionValue}
        className={cn(
          "group/reasoning-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
          isMainAccordionOpen && "border border-b! p-2",
        )}
      >
        <AccordionTrigger
          icon={
            <div className="relative">
              {isLoading ? (
                <Spinner
                  className={cn(
                    "text-foreground absolute inset-0 size-4 shrink-0 opacity-100 transition-[opacity,scale] duration-200 group-hover/reasoning-accordion:scale-0 group-hover/reasoning-accordion:opacity-0",
                    isMainAccordionOpen && "scale-0 opacity-0",
                  )}
                />
              ) : (
                <IconBrain
                  className={cn(
                    "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/reasoning-accordion:scale-0 group-hover/reasoning-accordion:opacity-0",
                    isMainAccordionOpen && "scale-0 opacity-0",
                  )}
                />
              )}
              <IconChevronDown
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
        <AccordionContent
          className={cn(
            "max-h-96 max-w-full overflow-auto p-0 pt-2 text-base",
            shouldRenderMarkdown &&
              "prose dark:prose-invert prose-sm prose-neutral prose-quoteless",
          )}
        >
          {shouldUsePerformantRenderer ? (
            <PerformantMarkdown content={text} />
          ) : shouldRenderMarkdown ? (
            <MemoizedMarkdown id={id} content={text} messageRole="assistant" simpleCodeBlocks />
          ) : (
            <pre
              className="text-base wrap-break-word whitespace-pre-wrap"
              style={{ fontFamily: "inherit" }}
            >
              {text}
            </pre>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
