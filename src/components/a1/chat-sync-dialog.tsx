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
import { type ChatSyncMode, chatSyncModeAtom } from "@/lib/jotai/sync-atoms";

interface ChatSyncDialogProps {
  mode: ChatSyncMode | null;
  onClose: () => void;
}

export const ChatSyncDialog = ({ mode, onClose }: ChatSyncDialogProps) => (
  <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>{mode && <ChatSyncDialogBody mode={mode} onDone={onClose} />}</DialogContent>
  </Dialog>
);

const ChatSyncDialogBody = ({ mode, onDone }: { mode: ChatSyncMode; onDone: () => void }) => {
  const { customerState, billingLoading } = useWebAuth();
  const canSyncChats = useCanSyncChats();
  const setChatSyncMode = useSetAtom(chatSyncModeAtom);

  if (canSyncChats) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {mode === "selected" ? "Sync the chats you choose?" : "Sync all your chats?"}
          </DialogTitle>
          <DialogDescription>
            {mode === "selected"
              ? "Chats stay on this device until you turn on Sync This Chat in their menu. Then they stay the same on every device you're signed in to."
              : "Keep all your chats the same on every device you're signed in to. You can stop syncing any chat from its menu."}
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
              setChatSyncMode(mode);
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
