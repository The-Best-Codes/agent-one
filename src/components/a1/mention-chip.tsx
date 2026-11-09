import { IconSparkles, type IconProps } from "@tabler/icons-react";
import { createElement } from "react";

import type { ChatMention } from "@/lib/chat-mentions";
import { getFileIcon, getFileName } from "@/lib/file-icons";

const ICON_PROPS: IconProps = { className: "text-primary size-[1em] shrink-0 self-center" };

export const MentionChip = ({ mention }: { mention: ChatMention }) => {
  const isFile = mention.kind === "file";
  const isFolder = isFile && /[/\\]$/.test(mention.value);
  const label = isFile ? `${getFileName(mention.value)}${isFolder ? "/" : ""}` : mention.value;
  return (
    <span
      title={isFile ? mention.value : `Skill: ${mention.value}`}
      data-mention={mention.kind}
      className="bg-primary/15 text-foreground inline-flex max-w-64 items-baseline gap-1 rounded-sm px-1 align-baseline font-medium"
    >
      {createElement(isFile ? getFileIcon(mention.value) : IconSparkles, ICON_PROPS)}
      <span className="truncate">{label}</span>
    </span>
  );
};
