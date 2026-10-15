import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";
import { marked, type Token, type Tokens } from "marked";
import { memo, useMemo, useRef } from "react";
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
import { settingAtoms } from "@/lib/jotai/settings-atoms";

import { CodeBlock } from "./codeblock";

type MarkdownBlock = {
  type: string;
  content: string;
  lang?: string;
};

type ParsedMarkdown = {
  remendEnabled: boolean;
  stableSource: string;
  stableBlocks: MarkdownBlock[];
  blocks: MarkdownBlock[];
};

const UNSTABLE_TAIL_TOKEN_COUNT = 2;

function tokenToBlock(token: Token): MarkdownBlock {
  if (token.type === "code") {
    return {
      type: "code",
      content: (token as Tokens.Code).text,
      lang: (token as Tokens.Code).lang,
    };
  }

  return {
    type: token.type,
    content: token.raw,
  };
}

function parseMarkdownIntoBlocks(
  markdown: string,
  remendEnabled: boolean,
  previous: ParsedMarkdown | null,
): ParsedMarkdown {
  const canReuse =
    previous !== null &&
    previous.remendEnabled === remendEnabled &&
    markdown.startsWith(previous.stableSource);
  const stableSource = canReuse ? previous.stableSource : "";
  const stableBlocks = canReuse ? previous.stableBlocks : [];

  const tail = markdown.slice(stableSource.length);
  const tokens = marked.lexer(remendEnabled ? remend(tail) : tail);
  const tailBlocks = tokens.map(tokenToBlock);

  let settledLength = 0;
  let settledCount = 0;
  while (settledCount < tokens.length - UNSTABLE_TAIL_TOKEN_COUNT) {
    const raw = tokens[settledCount].raw;
    if (!tail.startsWith(raw, settledLength)) {
      break;
    }
    settledLength += raw.length;
    settledCount++;
  }

  return {
    remendEnabled,
    stableSource:
      settledCount > 0 ? markdown.slice(0, stableSource.length + settledLength) : stableSource,
    stableBlocks:
      settledCount > 0 ? [...stableBlocks, ...tailBlocks.slice(0, settledCount)] : stableBlocks,
    blocks: [...stableBlocks, ...tailBlocks],
  };
}

const MemoizedMarkdownBlock = memo(
  ({
    allowInternalLinks,
    block,
    messageRole,
    remendEnabled,
    simpleCodeBlocks,
  }: {
    allowInternalLinks?: boolean;
    block: MarkdownBlock;
    messageRole: UIMessage["role"];
    remendEnabled: boolean;
    simpleCodeBlocks?: boolean;
  }) => {
    const { type, content, lang } = block;

    if (type === "code") {
      if (simpleCodeBlocks) {
        return (
          <pre>
            <code>{content}</code>
          </pre>
        );
      }

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
                  containerClassName="my-4 rounded-md border border-border first:mt-0 last:mb-0"
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
      prevProps.remendEnabled === nextProps.remendEnabled &&
      prevProps.simpleCodeBlocks === nextProps.simpleCodeBlocks
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
    simpleCodeBlocks,
  }: {
    allowInternalLinks?: boolean;
    content: string;
    id: string;
    messageRole: UIMessage["role"];
    simpleCodeBlocks?: boolean;
  }) => {
    const remendEnabled = useAtomValue(settingAtoms.REMEND_ENABLED);
    const parsedRef = useRef<ParsedMarkdown | null>(null);
    const blocks = useMemo(() => {
      const parsed = parseMarkdownIntoBlocks(content, remendEnabled, parsedRef.current);
      parsedRef.current = parsed;
      return parsed.blocks;
    }, [content, remendEnabled]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        allowInternalLinks={allowInternalLinks}
        block={block}
        messageRole={messageRole}
        remendEnabled={remendEnabled}
        simpleCodeBlocks={simpleCodeBlocks}
        key={`${id}-block_${index}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
