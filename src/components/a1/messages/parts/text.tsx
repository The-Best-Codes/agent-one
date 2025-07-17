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
    <div className="max-w-full overflow-auto rounded-md prose prose-sm">
      <MemoizedMarkdown id={id} content={text} />
    </div>
  );
};
