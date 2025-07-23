import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";
import {
  ArrowUpIcon,
  Loader2Icon,
  PaperclipIcon,
  SquareIcon,
} from "lucide-react";
import { memo, useRef, useState } from "react";
import { MainInputErrorSection } from "./error-section";

export const MainChatInput = memo(() => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { status } = useChatStatus();
  const { sendMessage, stop } = useChatFunctions();

  const [isEmpty, setIsEmpty] = useState(true);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const newValue = textarea.value;
    const newIsEmpty = !newValue.trim();

    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
    }

    requestAnimationFrame(() => {
      const previousHeight = textarea.style.height;
      textarea.style.height = "auto";
      const newHeight = `${textarea.scrollHeight}px`;

      if (previousHeight !== newHeight) {
        textarea.style.height = newHeight;
      }
    });
  };

  const handleSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    e.preventDefault();

    const inputValue = textareaRef.current?.value || "";

    if (inputValue.trim() && status === "ready") {
      sendMessage({ text: inputValue });
      if (textareaRef.current) {
        textareaRef.current.value = "";
        setIsEmpty(true);
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <>
      <MainInputErrorSection />
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
        className="w-full flex flex-col bg-secondary pr-2 pt-2 rounded-none md:rounded-md rounded-b-none border border-b-0 border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <Textarea
          autoFocus
          ref={textareaRef}
          className="bg-secondary dark:bg-secondary pr-0 pt-0 resize-none rounded-none md:rounded-md rounded-b-none min-h-10 max-h-40 overflow-auto border-none focus-visible:ring-0 shadow-none"
          placeholder="Ask anything..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          onChange={handleTextareaChange}
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
                onClick={() => stop()}
              >
                <SquareIcon />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={status !== "ready" || isEmpty}
              >
                {status === "submitted" ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <ArrowUpIcon />
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </>
  );
});

MainChatInput.displayName = "MainChatInput";
