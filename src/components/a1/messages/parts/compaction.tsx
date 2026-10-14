import { IconArrowsMinimize } from "@tabler/icons-react";

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

export const MessagePartCompaction = ({
  part,
  isLastMessage,
}: {
  part: CompactionPart;
  isLastMessage?: boolean;
}) => {
  const { status } = useChatStatus();
  const isBusy = isLastMessage && (status === "streaming" || status === "submitted");

  if (part.data.status !== "done") {
    if (!isBusy) return null;

    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner />
        Compacting conversation...
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="bg-transparent p-0 text-sm">
      <AccordionItem value="compaction" className="border-0">
        <AccordionTrigger className="text-muted-foreground items-center gap-2 p-0 hover:no-underline">
          <Separator className="flex-1" />
          <span className="flex items-center gap-1">
            <IconArrowsMinimize className="size-4" />
            Conversation compacted
          </span>
          <Separator className="flex-1" />
        </AccordionTrigger>
        <AccordionContent className="prose dark:prose-invert prose-sm prose-neutral prose-quoteless mt-2 max-h-96 max-w-full overflow-auto rounded-md border p-2 text-base">
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
