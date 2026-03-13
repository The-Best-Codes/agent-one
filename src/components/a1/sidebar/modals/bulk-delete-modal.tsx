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
}

export const BulkDeleteModal = ({ isOpen, onClose, chatIds, chatCount }: BulkDeleteModalProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bulkDeleteChats } = usePersistence();
  const chatLabel = chatCount === 1 ? "chat" : "chats";

  const handleDelete = () => {
    bulkDeleteChats(chatIds);
    if (activeChatId && chatIds.includes(activeChatId)) {
      void navigate("/chat");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {chatCount} {chatLabel}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {chatCount} {chatLabel}? This action cannot be undone.
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
