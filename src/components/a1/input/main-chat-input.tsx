import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatFunctions, useChatStatus } from "@/contexts/chat-context";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import { memo, useState } from "react";

export const MainChatInput = memo(() => {
  const [input, setInput] = useState("");
  const { status } = useChatStatus();
  const { sendMessage } = useChatFunctions();

  const handleSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        handleSubmit(e);
      }}
      className="w-full flex flex-col bg-secondary pr-2 pt-2 rounded-md rounded-b-none border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
    >
      <Textarea
        autoFocus
        className="bg-secondary dark:bg-secondary pr-0 pt-0 resize-none rounded-b-none field-sizing-content min-h-10 max-h-40 overflow-auto border-none focus-visible:ring-0"
        value={input}
        placeholder="Ask anything..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
      />
      <div className="bg-secondary dark:bg-secondary p-2 pr-0 rounded-b-md rounded-t-none flex justify-between items-center">
        <div className="relative">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  disabled={status !== "ready"}
                  size="icon"
                  onClick={() => {
                    console.log("Attachments not implemented yet");
                  }}
                >
                  <PaperclipIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Attach files</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          {status === "streaming" ? (
            <Button
              variant="destructive"
              type="button"
              size="icon"
              onClick={() => {
                console.log("Stop not implemented yet");
              }}
            >
              <SquareIcon />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={status !== "ready" || input.trim().length === 0}
            >
              <ArrowUpIcon />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
});

MainChatInput.displayName = "MainChatInput";
