"use client";
import { IconChevronDown } from "@tabler/icons-react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
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
            aria-label="Scroll to bottom"
          >
            <IconChevronDown data-testid="scroll-to-bottom-icon" data-icon="inline-start" />
            Scroll to bottom
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Options</ContextMenuLabel>
          <ContextMenuItem variant="destructive" onSelect={() => setShowSetting(false)}>
            Never show this button
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
