import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";
import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remend from "remend";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { remendEnabledAtom } from "@/lib/jotai/settings-atoms";

import { CodeBlock } from "./codeblock";

type MarkdownBlock = {
  type: string;
  content: string;
  lang?: string;
};

function parseMarkdownIntoBlocks(markdown: string, remendEnabled: boolean): MarkdownBlock[] {
  const completedMarkdown = remendEnabled ? remend(markdown) : markdown;
  const tokens = marked.lexer(completedMarkdown);
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
    allowInternalLinks,
    block,
    messageRole,
    remendEnabled,
  }: {
    allowInternalLinks?: boolean;
    block: MarkdownBlock;
    messageRole: UIMessage["role"];
    remendEnabled: boolean;
  }) => {
    const { type, content, lang } = block;

    if (type === "code") {
      return <CodeBlock content={content} lang={lang} messageRole={messageRole} />;
    } else {
      const completedContent = remendEnabled ? remend(content) : content;
      return (
        <ReactMarkdown
          remarkPlugins={[remarkBreaks, remarkGfm]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            a({ node, ...props }) {
              if (allowInternalLinks && props.href?.startsWith("/")) {
                return <Link to={props.href} {...props} />;
              }

              return <a {...props} target="_blank" rel="noopener noreferrer" />;
            },
            table({ ...props }) {
              return (
                <Table
                  containerClassName="rounded-md border border-border"
                  className="not-prose"
                  {...props}
                />
              );
            },
            thead({ ...props }) {
              return <TableHeader {...props} />;
            },
            tbody({ ...props }) {
              return <TableBody {...props} />;
            },
            tr({ ...props }) {
              return <TableRow {...props} />;
            },
            th({ ...props }) {
              return <TableHead {...props} />;
            },
            td({ ...props }) {
              return <TableCell {...props} />;
            },
          }}
        >
          {completedContent}
        </ReactMarkdown>
      );
    }
  },
  (prevProps, nextProps) => {
    return (
      prevProps.block.type === nextProps.block.type &&
      prevProps.block.content === nextProps.block.content &&
      prevProps.block.lang === nextProps.block.lang &&
      prevProps.allowInternalLinks === nextProps.allowInternalLinks &&
      prevProps.remendEnabled === nextProps.remendEnabled
    );
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({
    allowInternalLinks,
    content,
    id,
    messageRole,
  }: {
    allowInternalLinks?: boolean;
    content: string;
    id: string;
    messageRole: UIMessage["role"];
  }) => {
    const remendEnabled = useAtomValue(remendEnabledAtom);
    const blocks = useMemo(
      () => parseMarkdownIntoBlocks(content, remendEnabled),
      [content, remendEnabled],
    );

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        allowInternalLinks={allowInternalLinks}
        block={block}
        messageRole={messageRole}
        remendEnabled={remendEnabled}
        key={`${id}-block_${index}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
