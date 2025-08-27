import { VirtualizedChatList } from "./virtualized-chat-list";

interface ChatListProps {
  activeChatId?: string;
  handleNewChat: () => void;
}

export const ChatList = ({ activeChatId, handleNewChat }: ChatListProps) => {
  return (
    <VirtualizedChatList
      activeChatId={activeChatId}
      handleNewChat={handleNewChat}
      showNewChatButton={true}
    />
  );
};
