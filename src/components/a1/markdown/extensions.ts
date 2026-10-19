import type { InlineNode, MarkdownExtension } from "@tanstack/markdown";

const AUTOLINK_PATTERN = /^(?:https?:\/\/|www\.)[^\s<]+/i;
const AUTOLINK_TRAILING_PUNCTUATION = /[.,;:!?'")\]*_~]+$/;

export const autolinkExtension: MarkdownExtension = {
  name: "autolink",
  inlineParser: {
    markers: "hHwW",
    parse({ source, index, inLink }) {
      if (inLink) return undefined;

      const previous = source[index - 1];
      if (previous && /[\w/]/.test(previous)) return undefined;

      const match = AUTOLINK_PATTERN.exec(source.slice(index, index + 2048));
      if (!match) return undefined;

      const url = match[0].replace(AUTOLINK_TRAILING_PUNCTUATION, "");
      if (url.length < 5) return undefined;

      return {
        node: {
          type: "link",
          href: /^www\./i.test(url) ? `https://${url}` : url,
          children: [{ type: "text", value: url }],
        },
        length: url.length,
      };
    },
  },
};

function splitSoftBreaks(nodes: InlineNode[]): InlineNode[] {
  return nodes.flatMap((node): InlineNode[] => {
    if (node.type === "text" && node.value.includes("\n")) {
      return node.value
        .split("\n")
        .flatMap((value, index): InlineNode[] => [
          ...(index > 0 ? [{ type: "break" } as const] : []),
          ...(value ? [{ type: "text", value } as const] : []),
        ]);
    }

    if (
      node.type === "strong" ||
      node.type === "emphasis" ||
      node.type === "strike" ||
      node.type === "link"
    ) {
      return [{ ...node, children: splitSoftBreaks(node.children) }];
    }

    return [node];
  });
}

export const softBreaksExtension: MarkdownExtension = {
  name: "soft-breaks",
  transformInline: (nodes) => splitSoftBreaks(nodes),
};
