import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { VirtualizedChatList } from "./virtualized-chat-list";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatId?: string;
}

export const SearchModal = ({ isOpen, onClose, activeChatId }: SearchModalProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="flex h-fit max-w-2xl flex-col p-2">
        <DialogHeader>
          <DialogTitle className="sr-only flex items-center gap-2">
            {t("sidebar.chatSearchDialog")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("sidebar.searchSelectConversation")}
          </DialogDescription>
          <div className="max-h-[80svh] min-h-0 flex-1">
            <VirtualizedChatList
              activeChatId={activeChatId}
              showNewChatButton={false}
              className="h-full"
              additionalOnChatClickCallback={onClose}
            />
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
