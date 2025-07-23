import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import type { TextUIPart, UIMessage } from "ai";

const MAX_CHARS = 100000;

export const MessagePartText = ({
  id,
  text,
  messageRole,
}: {
  id: string;
  text: TextUIPart["text"];
  messageRole: UIMessage["role"];
}) => {
  const shouldUsePerformantRenderer = text.length > MAX_CHARS;

  return (
    <div className="max-w-full rounded-md prose dark:prose-invert prose-sm text-base prose-neutral prose-code:select-all">
      {shouldUsePerformantRenderer ? (
        <PerformantMarkdown content={text} />
      ) : (
        <MemoizedMarkdown id={id} content={text} messageRole={messageRole} />
      )}
    </div>
  );
};
