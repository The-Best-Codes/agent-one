"use client";
import { IconChevronDown } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { showChatToBottomButtonAtom } from "@/lib/jotai/settings-atoms";

interface ChatToBottomButtonProps {
  onClick: () => void;
  className?: string;
}

export function ChatToBottomButton({ onClick, className }: ChatToBottomButtonProps) {
  const { t } = useTranslation();
  const [showSetting, setShowSetting] = useAtom(showChatToBottomButtonAtom);

  if (!showSetting) return null;

  return (
    <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center">
      <ContextMenu>
        <ContextMenuTrigger>
          <Button
            data-testid="scroll-to-bottom"
            size="xs"
            onClick={onClick}
            className={className}
            variant="default"
            aria-label={t("chat.scrollToBottom")}
          >
            <IconChevronDown data-testid="scroll-to-bottom-icon" data-icon="inline-start" />
            {t("chat.scrollToBottom")}
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>{t("common.options")}</ContextMenuLabel>
            <ContextMenuItem variant="destructive" onSelect={() => setShowSetting(false)}>
              {t("chat.neverShowScrollButton")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
