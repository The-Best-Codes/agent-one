import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import type { TextUIPart, UIMessage } from "ai";

export const MessagePartText = ({
  id,
  text,
  messageRole,
}: {
  id: string;
  text: TextUIPart["text"];
  messageRole: UIMessage["role"];
}) => {
  return (
    <div className="max-w-full rounded-md prose dark:prose-invert prose-sm text-base prose-neutral prose-code:select-all">
      <MemoizedMarkdown id={id} content={text} messageRole={messageRole} />
    </div>
  );
};
