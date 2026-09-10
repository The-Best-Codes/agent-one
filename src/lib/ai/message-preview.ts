import type { UIMessage } from "ai";

export const NOTIFICATION_PREVIEW_MAX_LENGTH = 200;

export function getLastTextPart(message: UIMessage): string | undefined {
  for (let index = message.parts.length - 1; index >= 0; index--) {
    const part = message.parts[index];
    if (part.type === "text") {
      const text = part.text.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  }
}

export function truncateMessagePreview(
  text: string,
  maxLength = NOTIFICATION_PREVIEW_MAX_LENGTH,
): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}
