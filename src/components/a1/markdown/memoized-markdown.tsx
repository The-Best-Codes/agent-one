import { type MarkdownComponents, renderBlockReact } from "@tanstack/markdown/react";
import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";
import {
  type ComponentPropsWithoutRef,
  isValidElement,
  memo,
  type ReactNode,
  useMemo,
  useRef,
} from "react";
import { Link } from "react-router";

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
import { markdownParseOptions, type MarkdownBlock, parseMarkdownIntoBlocks } from "./parse-blocks";
import type { ParsedMarkdown } from "./parse-blocks";

type ComponentOptions = {
  allowInternalLinks?: boolean;
  messageRole: UIMessage["role"];
  simpleCodeBlocks?: boolean;
};

const getCodeText = (children: ReactNode): string => {
  if (!isValidElement<{ children?: ReactNode }>(children)) return "";
  const content = children.props.children;
  return Array.isArray(content) ? content.join("") : typeof content === "string" ? content : "";
};

function createComponents({
  allowInternalLinks,
  messageRole,
  simpleCodeBlocks,
}: ComponentOptions): MarkdownComponents {
  return {
    a(props: ComponentPropsWithoutRef<"a">) {
      if (allowInternalLinks && props.href?.startsWith("/")) {
        return <Link to={props.href} {...props} />;
      }

      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    },
    pre({
      children,
      "data-lang": dataLang,
    }: ComponentPropsWithoutRef<"pre"> & { "data-lang"?: string }) {
      const content = getCodeText(children);
      const lang = dataLang === "plaintext" ? undefined : dataLang;

      if (simpleCodeBlocks) {
        return (
          <pre>
            <code>{content}</code>
          </pre>
        );
      }

      return <CodeBlock content={content} lang={lang} messageRole={messageRole} />;
    },
    table(props: ComponentPropsWithoutRef<"table">) {
      return (
        <Table
          containerClassName="my-4 rounded-md border border-border first:mt-0 last:mb-0"
          className="not-prose"
          {...props}
        />
      );
    },
    thead: TableHeader,
    tbody: TableBody,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
  };
}

const MemoizedMarkdownBlock = memo(
  ({ block, components }: { block: MarkdownBlock; components: MarkdownComponents }) =>
    renderBlockReact(block.node, { ...markdownParseOptions, components }),
  (prevProps, nextProps) =>
    prevProps.block.key === nextProps.block.key && prevProps.components === nextProps.components,
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
    const components = useMemo(
      () => createComponents({ allowInternalLinks, messageRole, simpleCodeBlocks }),
      [allowInternalLinks, messageRole, simpleCodeBlocks],
    );

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock block={block} components={components} key={`${id}-block_${index}`} />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
