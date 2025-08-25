import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteChat } from "@/lib/ai/persistence";
import { useNavigate, useParams } from "react-router";

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export const DeleteChatModal = ({
  isOpen,
  onClose,
  chatId,
  chatTitle,
}: DeleteChatModalProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleDelete = () => {
    deleteChat(chatId);
    if (activeChatId === chatId) {
      navigate("/chat");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{chatTitle}"? This action cannot be
            undone.
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
