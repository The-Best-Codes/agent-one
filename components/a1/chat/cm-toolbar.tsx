import { CopyButton } from "@/components/a1/copy-button";
import React from "react";

interface ChatMessageToolbarProps {
  text: string;
}

export const ChatMessageToolbar: React.FC<ChatMessageToolbarProps> = ({
  text,
}) => {
  return (
    <div className="flex items-center justify-end gap-2 py-1">
      <CopyButton text={text} />
    </div>
  );
};
