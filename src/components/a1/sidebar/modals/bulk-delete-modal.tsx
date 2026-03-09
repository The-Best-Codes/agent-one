import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatIds: string[];
  chatCount: number;
  onComplete: () => void;
}

export const BulkDeleteModal = ({
  isOpen,
  onClose,
  chatIds,
  chatCount,
  onComplete,
}: BulkDeleteModalProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteChat } = usePersistence();

  const handleDelete = () => {
    for (const chatId of chatIds) {
      deleteChat(chatId);
    }
    if (activeChatId && chatIds.includes(activeChatId)) {
      void navigate("/chat");
    }
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {chatCount} Chats</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {chatCount} chats? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
