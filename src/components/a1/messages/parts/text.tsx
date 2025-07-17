import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import type { TextUIPart } from "ai";

export const MessagePartText = ({
  id,
  text,
}: {
  id: string;
  text: TextUIPart["text"];
}) => {
  return (
    <div className="max-w-full overflow-auto rounded-md prose dark:prose-invert prose-sm text-base prose-neutral prose-code:select-all">
      <MemoizedMarkdown id={id} content={text} />
    </div>
  );
};
