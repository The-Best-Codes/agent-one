export interface ChatMention {
  kind: "file" | "skill";
  value: string;
}

const MENTION_SCHEME = "mention://";

export const CHAT_MENTION_PATTERN = /\[[^\]\n]*\]\(mention:\/\/(file|skill)\/([^\s)]+)\)/g;

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

export function formatChatMention(mention: ChatMention): string {
  const label = (mention.kind === "file" ? `@${mention.value}` : `/${mention.value}`).replace(
    /[[\]\n]/g,
    "",
  );
  return `[${label}](${MENTION_SCHEME}${mention.kind}/${encodeMentionValue(mention.value)})`;
}

export function getChatMention(match: RegExpMatchArray): ChatMention {
  return { kind: match[1] as ChatMention["kind"], value: decodeMentionValue(match[2]) };
}

export function parseChatMentionHref(href: string | undefined): ChatMention | undefined {
  const match = href ? /^mention:\/\/(file|skill)\/(.+)$/.exec(href) : null;
  return match ? getChatMention(match) : undefined;
}

export function formatChatMentionsAsText(text: string): string {
  return text.replace(
    CHAT_MENTION_PATTERN,
    (_match, kind: string, value: string) =>
      `${kind === "file" ? "@" : "/"}${decodeMentionValue(value)}`,
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
