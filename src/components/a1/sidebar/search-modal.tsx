import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchIcon } from "lucide-react";
import { VirtualizedChatList } from "./virtualized-chat-list";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatId?: string;
  handleNewChat: () => void;
}

export const SearchModal = ({
  isOpen,
  onClose,
  activeChatId,
  handleNewChat,
}: SearchModalProps) => {
  const handleNewChatAndClose = () => {
    handleNewChat();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Search Chats
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <VirtualizedChatList
            activeChatId={activeChatId}
            handleNewChat={handleNewChatAndClose}
            showNewChatButton={false}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
