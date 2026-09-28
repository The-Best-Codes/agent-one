import { IconArchive } from "@tabler/icons-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import type { CompactionProgress } from "@/lib/ai/chat-compaction";

import { MessagePartText } from "./text";

export function MessagePartCompaction({
  id,
  summary,
  progress,
}: {
  id: string;
  summary: string;
  progress?: CompactionProgress;
}) {
  const label = !progress
    ? "Conversation compacted"
    : progress.phase === "chunks"
      ? `Compacting ${progress.totalChunks} chunks, ${progress.completedChunks} complete…`
      : progress.phase === "finalizing"
        ? "Finalizing compaction…"
        : "Compacting…";

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="compaction">
        <AccordionTrigger>
          <span className="flex items-center gap-2" role={progress ? "status" : undefined}>
            {progress ? <Spinner /> : <IconArchive className="size-4" />}
            {label}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="max-h-96 overflow-auto">
            {summary ? (
              <MessagePartText id={id} text={summary} messageRole="assistant" />
            ) : (
              <p className="text-muted-foreground">
                Preparing a summary to make room for the conversation.
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
