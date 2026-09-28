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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[80svh] max-w-2xl flex-col gap-0 p-2"
      >
        <DialogHeader>
          <DialogTitle className="sr-only flex items-center gap-2">Chat search dialog</DialogTitle>
          <DialogDescription className="sr-only">
            Select a conversation to continue
          </DialogDescription>
        </DialogHeader>
        <VirtualizedChatList
          activeChatId={activeChatId}
          showNewChatButton={false}
          className="h-auto min-h-0"
          additionalOnChatClickCallback={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
