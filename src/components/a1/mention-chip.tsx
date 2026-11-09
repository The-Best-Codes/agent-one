import { useSetAtom } from "jotai";

import { attachmentPreviewAtom } from "@/lib/attachments";
import {
  type ChatMention,
  getMentionDisplay,
  MENTION_CHIP_CLASS,
  MENTION_ICON_CLASS,
} from "@/lib/chat-mentions";
import { cn } from "@/lib/utils";

export const MentionChip = ({ mention }: { mention: ChatMention }) => {
  const setPreview = useSetAtom(attachmentPreviewAtom);
  const { label, title, iconSvg } = getMentionDisplay(mention);
  const isAttachment = mention.kind === "attachment";
  const Chip = isAttachment ? "button" : "span";

  return (
    <Chip
      type={isAttachment ? "button" : undefined}
      title={title}
      data-mention={mention.kind}
      onClick={isAttachment ? () => setPreview(mention.path) : undefined}
      className={cn(MENTION_CHIP_CLASS, isAttachment && "hover:bg-primary/25 cursor-pointer")}
    >
      <span className={MENTION_ICON_CLASS} dangerouslySetInnerHTML={{ __html: iconSvg }} />
      <span className="truncate">{label}</span>
    </Chip>
  );
};
