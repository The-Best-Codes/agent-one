import { MessageSquare } from "lucide-react";

export const EmptyChatState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-4xl font-bold text-foreground">
        How can I help you?
      </h2>
      <p className="text-muted-foreground mt-2">
        Send a message to AgentOne to get started
      </p>
    </div>
  );
};
