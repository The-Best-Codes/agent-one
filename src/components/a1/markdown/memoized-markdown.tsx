import type { UIMessage } from "ai";
import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./codeblock";

type MarkdownBlock = {
  type: string;
  content: string;
  lang?: string;
};

function parseMarkdownIntoBlocks(markdown: string): MarkdownBlock[] {
  const tokens = marked.lexer(markdown);
  const blocks: MarkdownBlock[] = [];

  for (const token of tokens) {
    if (token.type === "code") {
      blocks.push({
        type: "code",
        content: token.text,
        lang: token.lang,
      });
    } else {
      blocks.push({
        type: token.type,
        content: token.raw,
      });
    }
  }
  return blocks;
}

const MemoizedMarkdownBlock = memo(
  ({
    block,
    messageRole,
  }: {
    block: MarkdownBlock;
    messageRole: UIMessage["role"];
  }) => {
    const { type, content, lang } = block;

    if (type === "code") {
      return (
        <CodeBlock content={content} lang={lang} messageRole={messageRole} />
      );
    } else {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkBreaks, remarkGfm]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            a({ node, ...props }) {
              return <a {...props} target="_blank" rel="noopener noreferrer" />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }
  },
  (prevProps, nextProps) => {
    return (
      prevProps.block.type === nextProps.block.type &&
      prevProps.block.content === nextProps.block.content &&
      prevProps.block.lang === nextProps.block.lang
    );
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({
    content,
    id,
    messageRole,
  }: {
    content: string;
    id: string;
    messageRole: UIMessage["role"];
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        block={block}
        messageRole={messageRole}
        key={`${id}-block_${index}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
