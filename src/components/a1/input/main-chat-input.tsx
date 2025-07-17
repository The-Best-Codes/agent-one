import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatContext } from "@/contexts/chat-context";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import { useState } from "react";

export const MainChatInput = () => {
  const [input, setInput] = useState("");
  const { sendMessage, status } = useChatContext();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          sendMessage({ text: input });
          setInput("");
        }
      }}
      className="flex flex-col bg-secondary pr-2 pt-2 rounded-md border focus-within:border-ring"
    >
      <Textarea
        autoFocus
        className="bg-secondary dark:bg-secondary pr-0 pt-0 resize-none rounded-b-none field-sizing-content min-h-10 max-h-40 overflow-auto border-none focus-visible:ring-0"
        value={input}
        placeholder="Ask anything..."
        onChange={(e) => setInput(e.target.value)}
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
              onClick={stop}
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
};
