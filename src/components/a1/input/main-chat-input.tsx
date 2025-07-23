import { Button } from "@/components/ui/button";
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
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  ArrowUpIcon,
  Loader2Icon,
  PaperclipIcon,
  SquareIcon,
} from "lucide-react";
import { memo, useState } from "react";
import { MainInputErrorSection } from "./error-section";

const editorTheme = EditorView.theme({
  "&": {
    border: "none",
    backgroundColor: "transparent !important",
  },
  "& .cm-placeholder": {
    color: "#6b7280",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "inherit",
  },
  ".cm-content": {
    paddingTop: "0px",
    paddingBottom: "0px",
  },
});

export const MainChatInput = memo(() => {
  const { status } = useChatStatus();
  const { sendMessage, stop } = useChatFunctions();

  const [value, setValue] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);

  const handleEditorChange = (newValue: string) => {
    setValue(newValue);
    const newIsEmpty = !newValue.trim();
    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
    }
  };

  const submitMessage = () => {
    if (value.trim() && status === "ready") {
      sendMessage({ text: value });
      setValue("");
      setIsEmpty(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  return (
    <>
      <MainInputErrorSection />
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col bg-secondary pr-2 pl-1 pt-2 rounded-none md:rounded-md rounded-b-none border border-b-0 border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <div className="flex-grow overflow-hidden">
          <CodeMirror
            autoFocus
            value={value}
            minHeight="40px"
            maxHeight="160px"
            placeholder="Ask anything..."
            className="bg-transparent text-base"
            extensions={[
              markdown({ base: markdownLanguage }),
              editorTheme,
              EditorView.lineWrapping,
            ]}
            onChange={handleEditorChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
              }
            }}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
              autocompletion: false,
              searchKeymap: false,
              lintKeymap: false,
              completionKeymap: false,
            }}
          />
        </div>
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
