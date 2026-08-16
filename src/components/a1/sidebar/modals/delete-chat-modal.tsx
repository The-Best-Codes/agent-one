import { useTranslation } from "react-i18next";
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

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export const DeleteChatModal = ({ isOpen, onClose, chatId, chatTitle }: DeleteChatModalProps) => {
  const { t } = useTranslation();
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteChat } = usePersistence();

  const handleDelete = () => {
    deleteChat(chatId);
    if (activeChatId === chatId) {
      void navigate("/chat");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sidebar.deleteChat")}</DialogTitle>
          <DialogDescription>
            {t("sidebar.deleteChatConfirm", { title: chatTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
