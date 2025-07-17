import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
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
  ({ block }: { block: MarkdownBlock }) => {
    const { type, content, lang } = block;

    if (type === "code") {
      return <CodeBlock content={content} lang={lang} />;
    } else {
      return <ReactMarkdown>{content}</ReactMarkdown>;
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
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock block={block} key={`${id}-block_${index}`} />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
