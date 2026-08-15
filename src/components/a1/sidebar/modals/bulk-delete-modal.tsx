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

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatIds: string[];
  chatCount: number;
}

export const BulkDeleteModal = ({ isOpen, onClose, chatIds, chatCount }: BulkDeleteModalProps) => {
  const { t } = useTranslation();
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
          <DialogTitle>{t("sidebar.deleteChatsTitle", { count: chatCount })}</DialogTitle>
          <DialogDescription>
            {t("sidebar.deleteChatsConfirm", { count: chatCount })}
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
