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

export const SearchModal = ({
  isOpen,
  onClose,
  activeChatId,
}: SearchModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex h-fit max-h-[80svh] max-w-2xl flex-col p-2"
      >
        <DialogHeader>
          <DialogTitle className="sr-only flex items-center gap-2">
            Chat search dialog
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select a conversation to continue
          </DialogDescription>
          <div className="h-96 min-h-0 flex-1">
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
