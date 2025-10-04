import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";

interface ChangeTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentTitle: string;
}

const ChangeTitleForm = ({
  currentTitle,
  chatId,
  onClose,
}: {
  currentTitle: string;
  chatId: string;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState(currentTitle);
  const { saveChatTitle } = usePersistence();

  const handleSave = () => {
    if (title.trim() && title.trim() !== currentTitle) {
      saveChatTitle({ chatId, title: title.trim() });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter chat title..."
        autoFocus
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
};

export const ChangeTitleModal = ({
  isOpen,
  onClose,
  chatId,
  currentTitle,
}: ChangeTitleModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Chat Title</DialogTitle>
          <DialogDescription>
            Enter a new title for this chat conversation.
          </DialogDescription>
        </DialogHeader>
        <ChangeTitleForm
          currentTitle={currentTitle}
          chatId={chatId}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
