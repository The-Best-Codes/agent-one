import { type BlockNode, type ParseOptions, parseMarkdown } from "@tanstack/markdown";
import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";
import remend from "remend";

import { autolinkExtension, softBreaksExtension } from "./extensions";

export type MarkdownBlock = {
  node: BlockNode;
  key: string;
};

export type ParsedMarkdown = {
  remendEnabled: boolean;
  stableSource: string;
  stableBlocks: MarkdownBlock[];
  blocks: MarkdownBlock[];
};

export const markdownParseOptions: ParseOptions = {
  extensions: [streamingMarkdownExtension(), autolinkExtension, softBreaksExtension],
  frontmatter: false,
  headingIds: false,
};

const UNSTABLE_TAIL_BLOCK_COUNT = 2;
const CONTINUATION_LINE = /^(?:\s|[-*+](?:\s|$)|\d+[.)](?:\s|$))/;
const FENCE_LINE = /^\s{0,3}(?:```|~~~)/;

// Offsets where a blank line outside a code fence is followed by a line that
// can only begin a new top-level block, so each segment can be parsed on its own.
function findSafeCuts(source: string, from: number) {
  const cuts: number[] = [];
  let inFence = false;
  let previousBlank = false;
  let lineStart = from;

  while (lineStart < source.length) {
    const newline = source.indexOf("\n", lineStart);
    if (newline === -1) break;

    const line = source.slice(lineStart, newline);
    const nextStart = newline + 1;
    if (FENCE_LINE.test(line)) inFence = !inFence;

    const blank = line.trim() === "";
    if (!inFence && blank && !previousBlank && lineStart > from) {
      const nextNewline = source.indexOf("\n", nextStart);
      const nextLine = source.slice(nextStart, nextNewline === -1 ? source.length : nextNewline);
      if (nextLine.length > 0 && !CONTINUATION_LINE.test(nextLine)) {
        cuts.push(nextStart);
      }
    }

    previousBlank = blank;
    lineStart = nextStart;
  }

  return cuts;
}

const toBlocks = (source: string) =>
  parseMarkdown(source, markdownParseOptions).children.map((node) => ({
    node,
    key: JSON.stringify(node),
  }));

export function parseMarkdownIntoBlocks(
  markdown: string,
  remendEnabled: boolean,
  previous: ParsedMarkdown | null,
): ParsedMarkdown {
  const canReuse =
    previous !== null &&
    previous.remendEnabled === remendEnabled &&
    markdown.startsWith(previous.stableSource);
  const stableSource = canReuse ? previous.stableSource : "";
  const stableBlocks = canReuse ? [...previous.stableBlocks] : [];

  const boundaries = [
    stableSource.length,
    ...findSafeCuts(markdown, stableSource.length),
    markdown.length,
  ];
  const settledIndex = Math.max(0, boundaries.length - 1 - UNSTABLE_TAIL_BLOCK_COUNT);
  const tailBlocks: MarkdownBlock[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segment = markdown.slice(boundaries[i], boundaries[i + 1]);
    if (i < settledIndex) {
      stableBlocks.push(...toBlocks(segment));
    } else {
      tailBlocks.push(...toBlocks(remendEnabled ? remend(segment) : segment));
    }
  }

  return {
    remendEnabled,
    stableSource: markdown.slice(0, boundaries[settledIndex]),
    stableBlocks,
    blocks: [...stableBlocks, ...tailBlocks],
  };
}
