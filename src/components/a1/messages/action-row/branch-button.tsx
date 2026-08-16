import { IconArrowsSplit } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

type BranchButtonProps = {
  onBranch: () => void;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "disabled" | "size" | "variant" | "aria-label" | "children"
>;

export const BranchButton = ({ onBranch, className, ...props }: BranchButtonProps) => {
  const { t } = useTranslation();
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <Button
      onClick={onBranch}
      disabled={isStreaming}
      className={className}
      size="icon-sm"
      variant="secondary"
      aria-label={t("messages.branchFromMessage")}
      {...props}
    >
      <IconArrowsSplit data-icon="inline-start" />
    </Button>
  );
};
