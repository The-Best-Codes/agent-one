import { CHAT_ICON_SVG, getFileIconSvg, getFileName, SKILL_ICON_SVG } from "@/lib/file-icons";

export type ChatMention =
  | { kind: "file" | "skill"; value: string }
  | { kind: "chat"; value: string; label: string }
  | { kind: "attachment"; path: string };

const MENTION_SCHEME = "mention://";

export const MENTION_CHIP_CLASS =
  "bg-primary/15 text-foreground inline-flex max-w-64 items-baseline gap-1 rounded-sm px-1 align-baseline font-medium";
export const MENTION_ICON_CLASS = "text-primary flex shrink-0 self-center [&>svg]:size-[1em]";

export function getMentionDisplay(mention: ChatMention) {
  switch (mention.kind) {
    case "skill":
      return { label: mention.value, title: `Skill: ${mention.value}`, iconSvg: SKILL_ICON_SVG };
    case "chat":
      return {
        label: mention.label || "Chat",
        title: `Chat: ${mention.label || mention.value}`,
        iconSvg: CHAT_ICON_SVG,
      };
    case "attachment":
      return {
        label: getFileName(mention.path),
        title: mention.path,
        iconSvg: getFileIconSvg(mention.path),
      };
    default: {
      const isFolder = /[/\\]$/.test(mention.value);
      return {
        label: `${getFileName(mention.value)}${isFolder ? "/" : ""}`,
        title: mention.value,
        iconSvg: getFileIconSvg(mention.value),
      };
    }
  }
}

export function getMentionPath(mention: ChatMention): string | undefined {
  if (mention.kind === "attachment") return mention.path;
  if (mention.kind === "file") return mention.value;
  return undefined;
}

export const CHAT_MENTION_PATTERN =
  /\[([^\]\n]*)\]\((?:mention:\/\/(file|skill|chat)\/|attachment:\/\/)([^\s)]+)\)/g;

function encodeMentionValue(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment).replace(/\(/g, "%28").replace(/\)/g, "%29"))
    .join("/");
}

function decodeMentionValue(value: string): string {
  try {
    return value.split("/").map(decodeURIComponent).join("/");
  } catch {
    return value;
  }
}

function cleanLabel(label: string): string {
  return label.replace(/[[\]\n]/g, "");
}

export function formatChatMention(mention: ChatMention): string {
  switch (mention.kind) {
    case "attachment":
      return `[${cleanLabel(getFileName(mention.path))}](attachment://${encodeMentionValue(mention.path)})`;
    case "chat":
      return `[${cleanLabel(mention.label)}](${MENTION_SCHEME}chat/${encodeMentionValue(mention.value)})`;
    default: {
      const label = cleanLabel(getMentionText(mention));
      return `[${label}](${MENTION_SCHEME}${mention.kind}/${encodeMentionValue(mention.value)})`;
    }
  }
}

function toChatMention(label: string, kind: string | undefined, value: string): ChatMention {
  if (!kind) return { kind: "attachment", path: decodeMentionValue(value) };
  if (kind === "chat") return { kind, value: decodeMentionValue(value), label };
  return { kind: kind as "file" | "skill", value: decodeMentionValue(value) };
}

export function getChatMention(match: RegExpMatchArray): ChatMention {
  return toChatMention(match[1], match[2], match[3]);
}

export function parseChatMentionHref(
  href: string | undefined,
  label = "",
): ChatMention | undefined {
  const match = href
    ? /^(?:mention:\/\/(file|skill|chat)\/|attachment:\/\/)(\S+)$/.exec(href)
    : null;
  return match ? toChatMention(label, match[1], match[2]) : undefined;
}

function getMentionText(mention: ChatMention): string {
  switch (mention.kind) {
    case "file":
      return `@${getMentionDisplay(mention).label}`;
    case "skill":
      return `/${mention.value}`;
    case "chat":
      return mention.label;
    case "attachment":
      return getFileName(mention.path);
  }
}

export function formatChatMentionsAsText(text: string): string {
  return text.replace(CHAT_MENTION_PATTERN, (_match, label: string, kind: string, value: string) =>
    getMentionText(toChatMention(label, kind, value)),
  );
}

export function splitChatMentions(text: string): (string | ChatMention)[] {
  const parts: (string | ChatMention)[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CHAT_MENTION_PATTERN)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(getChatMention(match));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
