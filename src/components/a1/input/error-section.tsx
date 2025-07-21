import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate } = useChatFunctions();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center justify-between bg-destructive text-primary-foreground rounded-md p-2 mb-2 gap-2">
      <span className="max-w-full max-h-10 overflow-auto">{errorText}</span>
      <div className="flex flex-row items-center gap-2">
        <Button onClick={() => regenerate()} variant="secondary">
          Retry
          {/* TODO: Add tooltip explaining that this regenerates the whole previous message (including tool calls etc), not just the last part */}
        </Button>
      </div>
    </div>
  );
};
