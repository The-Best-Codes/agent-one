import { VirtualizedChatList } from "./virtualized-chat-list";

interface ChatListProps {
  activeChatId?: string;
  handleNewChat: () => void;
  onChatClick?: (id: string) => void;
}

export const ChatList = ({ activeChatId, handleNewChat, onChatClick }: ChatListProps) => {
  return (
    <VirtualizedChatList
      activeChatId={activeChatId}
      handleNewChat={handleNewChat}
      showNewChatButton={true}
      additionalOnChatClickCallback={onChatClick}
    />
  );
};
