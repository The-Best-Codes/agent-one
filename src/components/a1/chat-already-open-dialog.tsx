import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatAlreadyOpenDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  otherWindowCount: number;
}

export const ChatAlreadyOpenDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  otherWindowCount,
}: ChatAlreadyOpenDialogProps) => {
  const windowWord = otherWindowCount === 1 ? "window" : "windows";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chat already open</DialogTitle>
          <DialogDescription>
            This chat is already open in {otherWindowCount} other {windowWord}. Opening the same
            chat in multiple windows at once can cause unexpected behavior such as duplicated
            messages, lost edits, or out-of-sync state.
            <br />
            <br />
            We recommend keeping each chat open in only one window at a time. Are you sure you want
            to open it here as well?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Open here anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
