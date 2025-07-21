import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate, resumeStream } = useChatFunctions();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center justify-between bg-destructive text-primary-foreground rounded-md p-2 mb-2 gap-2">
      <span className="max-w-full max-h-10 overflow-auto">{errorText}</span>
      <Button onClick={() => regenerate()} variant="secondary">
        Retry
        {/* TODO: Add tooltip explaining that this regenerates the whole previous message (including tool calls etc), not just the last part */}
      </Button>
      <Button onClick={() => resumeStream()} variant="secondary">
        Resume
        {/* TODO: Does resume even work? Is it applicable here? May remove it. */}
      </Button>
    </div>
  );
};
