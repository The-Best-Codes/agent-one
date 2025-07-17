import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import type { TextUIPart } from "ai";

type MessagePartTextProps = TextUIPart & { id: string };

export const MessagePartText = ({ id, text }: MessagePartTextProps) => {
  return (
    <div className="max-w-full overflow-auto rounded-md">
      <MemoizedMarkdown id={id} content={text} />
    </div>
  );
};
