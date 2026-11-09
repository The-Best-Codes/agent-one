import {
  type ChatMention,
  getMentionDisplay,
  MENTION_CHIP_CLASS,
  MENTION_ICON_CLASS,
} from "@/lib/chat-mentions";

export const MentionChip = ({ mention }: { mention: ChatMention }) => {
  const { label, title, iconSvg } = getMentionDisplay(mention);
  return (
    <span title={title} data-mention={mention.kind} className={MENTION_CHIP_CLASS}>
      <span className={MENTION_ICON_CLASS} dangerouslySetInnerHTML={{ __html: iconSvg }} />
      <span className="truncate">{label}</span>
    </span>
  );
};
