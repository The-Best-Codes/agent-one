import { Button } from "@/components/ui/button";
import { useChatFunctions, useChatStatus } from "@/contexts/chat-context";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate } = useChatFunctions();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center justify-between bg-destructive text-primary-foreground rounded-md px-3 py-2 mb-2">
      <span className="max-w-full">{errorText}</span>
      <Button onClick={() => regenerate()} variant="secondary">
        Retry
        {/* TODO: Add tooltip explaining that this regenerates the whole previous message (including tool calls etc), not just the last part */}
      </Button>
    </div>
  );
};
