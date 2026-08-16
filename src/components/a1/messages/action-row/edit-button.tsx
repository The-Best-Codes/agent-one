import { IconEdit } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

type EditButtonProps = {
  onEdit: () => void;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "disabled" | "size" | "variant" | "aria-label" | "children"
>;

export const EditButton = ({ onEdit, className, ...props }: EditButtonProps) => {
  const { t } = useTranslation();
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <Button
      onClick={onEdit}
      disabled={isStreaming}
      className={className}
      size="icon-sm"
      variant="secondary"
      aria-label={t("messages.editMessage")}
      {...props}
    >
      <IconEdit data-icon="inline-start" />
    </Button>
  );
};
