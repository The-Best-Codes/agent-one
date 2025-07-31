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
import { getLogger } from "@/lib/logger";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  ArrowUpIcon,
  Loader2Icon,
  PaperclipIcon,
  SquareIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { MainInputErrorSection } from "./error-section";

const logger = getLogger(import.meta.url);

const editorTheme = EditorView.theme({
  "&": {
    border: "none",
    backgroundColor: "transparent !important",
  },
  "& .cm-placeholder": {
    color: "var(--muted-foreground);",
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
  ".cm-line": {
    padding: "0 0.125rem 0 0.625rem",
  },
});

export const MainChatInput = ({
  onAfterSend,
}: {
  onAfterSend?: () => void;
}) => {
  const { status } = useChatStatus();
  const { sendMessage, stop } = useChatFunctions();

  const [isEmpty, setIsEmpty] = useState(true);

  const editorViewRef = useRef<EditorView | null>(null);

  const handleEditorChange = (newValue: string) => {
    const newIsEmpty = !newValue.trim();
    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
    }
  };

  const submitMessage = () => {
    const currentText = editorViewRef.current?.state.doc.toString() || "";

    if (currentText.trim() && status === "ready") {
      sendMessage({ text: currentText });
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: "",
          },
        });
      }
      setIsEmpty(true);
      onAfterSend?.();
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
        className="w-full flex flex-col bg-secondary pr-2 pt-2 rounded-none md:rounded-md md:rounded-b-none border border-b-0 border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <div className="flex-grow overflow-hidden">
          <CodeMirror
            autoFocus
            theme="light" // TODO: Base this off of real theme, next-themes for example
            defaultValue=""
            minHeight="40px"
            maxHeight="160px"
            placeholder="Ask anything..."
            className="bg-transparent text-sm"
            extensions={[
              markdown({ base: markdownLanguage }),
              editorTheme,
              EditorView.lineWrapping,
              EditorView.contentAttributes.of({ spellcheck: "true" }),
              Prec.highest(
                keymap.of([
                  {
                    key: "Enter",
                    run: () => {
                      submitMessage();
                      return true;
                    },
                  },
                ]),
              ),
            ]}
            onChange={handleEditorChange}
            onCreateEditor={(view) => {
              editorViewRef.current = view;
              setIsEmpty(!view.state.doc.toString().trim());
            }}
            indentWithTab={false}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
              highlightSelectionMatches: false,
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
                      logger.log("Attachments not implemented yet");
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
};

MainChatInput.displayName = "MainChatInput";
