import { useSetAtom } from "jotai";

import { PlanCheckingStep, UpgradeRequiredStep } from "@/components/a1/plan-required-steps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  if (canSyncChats) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Turn on chat sync?</DialogTitle>
          <DialogDescription>
            Keep your chats the same on every device you're signed in to.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
          <li>
            If a chat is changed on two devices before they sync, the most recent version is kept
            and the other one is replaced.
          </li>
          <li>Deleting a chat on one device deletes it on your other devices too.</li>
          <li>Chats in projects stay on this device only.</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setChatSyncEnabled(true);
              onDone();
            }}
          >
            Turn on sync
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (!customerState && billingLoading) {
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
