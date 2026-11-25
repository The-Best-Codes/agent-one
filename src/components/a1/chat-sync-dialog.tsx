import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { PlanCheckingStep, UpgradeRequiredStep } from "@/components/a1/plan-required-steps";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { useCanSyncChats } from "@/hooks/use-can-sync-chats";
import { chatSyncEnabledAtom } from "@/lib/jotai/sync-atoms";

interface ChatSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatSyncDialog = ({ open, onOpenChange }: ChatSyncDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      {open && <ChatSyncDialogBody onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);

const ChatSyncDialogBody = ({ onDone }: { onDone: () => void }) => {
  const { customerState, billingLoading } = useWebAuth();
  const canSyncChats = useCanSyncChats();
  const setChatSyncEnabled = useSetAtom(chatSyncEnabledAtom);

  useEffect(() => {
    if (!canSyncChats) return;
    setChatSyncEnabled(true);
    onDone();
  }, [canSyncChats, onDone, setChatSyncEnabled]);

  if (canSyncChats || (!customerState && billingLoading)) {
    return <PlanCheckingStep title="Sync chats" />;
  }

  return (
    <UpgradeRequiredStep
      title="Sync chats"
      description="Syncing chats across devices requires a Pro plan or higher. You're on the Free plan right now."
      onCancel={onDone}
    />
  );
};
