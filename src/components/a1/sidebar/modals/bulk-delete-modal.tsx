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
            {chatCount === 1 ? `Delete ${chatCount} chat` : `Delete ${chatCount} chats`}
          </DialogTitle>
          <DialogDescription>
            {chatCount === 1
              ? `Are you sure you want to delete ${chatCount} chat? This action cannot be undone.`
              : `Are you sure you want to delete ${chatCount} chats? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {"Cancel"}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {"Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
