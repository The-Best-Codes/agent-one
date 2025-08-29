"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";
import useMobileDetection from "@/hooks/use-mobile-detection";
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
import { useTheme } from "next-themes";
import { useCallback, useRef, useState } from "react";
import { Attachments } from "./attachments";
import { MainInputErrorSection } from "./error-section";

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
    color: "var(--foreground);",
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
  const { resolvedTheme } = useTheme();
  const { sendMessage, stop } = useChatFunctions();
  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const [isEmpty, setIsEmpty] = useState(true);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const editorViewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

  const handleEditorChange = (newValue: string) => {
    const newIsEmpty = !newValue.trim();
    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
    }
  };

  const submitMessage = () => {
    const currentText = editorViewRef.current?.state.doc.toString() || "";

    if ((currentText.trim() || files) && status === "ready") {
      sendMessage({
        text: currentText || "",
        files: files,
      });
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
      setFiles(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onAfterSend?.();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  const addFiles = useCallback(
    (newFiles: FileList) => {
      if (!newFiles || newFiles.length === 0) return;

      const currentFiles = files ? Array.from(files) : [];
      const newFilesArray = Array.from(newFiles);

      const combined = [...currentFiles, ...newFilesArray];

      const dt = new DataTransfer();
      combined.forEach((file) => dt.items.add(file));
      const updatedFileList = dt.files;

      setFiles(updatedFileList.length > 0 ? updatedFileList : undefined);
      if (fileInputRef.current) {
        fileInputRef.current.files = updatedFileList;
      }
    },
    [files],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = e.target.files;
      setFiles(newFiles.length > 0 ? newFiles : undefined);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (!files) return;

    const filesArray = Array.from(files);
    filesArray.splice(index, 1);

    const dt = new DataTransfer();
    filesArray.forEach((file) => dt.items.add(file));

    const newFileList = dt.files;
    setFiles(newFileList.length > 0 ? newFileList : undefined);

    if (fileInputRef.current) {
      fileInputRef.current.files = newFileList;
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [addFiles],
  );

  return (
    <div className="px-0 md:px-2">
      <MainInputErrorSection />
      <form
        data-testid="chat-form"
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="bg-secondary border-input focus-within:border-ring focus-within:ring-ring/50 relative flex w-full flex-col rounded-none border-0 border-t-1 pt-2 pr-2 md:rounded-md md:rounded-b-none md:border md:border-b-0 md:focus-within:ring-[3px]"
      >
        {isDragging && (
          <div className="border-primary bg-background/80 absolute inset-0 z-20 flex items-center justify-center rounded-md rounded-b-none border-2 border-dashed backdrop-blur-sm">
            <p className="text-primary text-lg font-semibold">
              Drop files to attach
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,text/*,video/*,application/pdf,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.rs,.go,.rb,.php,.swift,.kt"
        />
        {files && files.length > 0 && (
          <Attachments files={files} onRemove={handleRemoveFile} />
        )}
        <div className="flex-grow overflow-hidden">
          <CodeMirror
            autoFocus
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            defaultValue=""
            minHeight="40px"
            maxHeight="160px"
            placeholder="Ask anything..."
            className="bg-transparent text-sm"
            extensions={[
              markdown({ base: markdownLanguage }),
              editorTheme,
              EditorView.lineWrapping,
              EditorView.contentAttributes.of({
                spellcheck: "true",
                "aria-label": "Chat message input",
                "data-testid": "chat-editor",
              }),
              EditorView.domEventHandlers({
                paste: (event) => {
                  const pastedFiles = event.clipboardData?.files;
                  if (pastedFiles && pastedFiles.length > 0) {
                    addFiles(pastedFiles);
                    event.preventDefault();
                    return true;
                  }
                  return false;
                },
              }),
              Prec.highest(
                keymap.of([
                  {
                    // TODO: Later, allow changing the send key to CTRL/CMD + Enter
                    key: "Enter",
                    run: () => {
                      if (isMobile) {
                        return false;
                      }
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
        <div className="bg-secondary dark:bg-secondary flex items-center justify-between rounded-t-none rounded-b-md p-2 pr-0">
          <div className="relative">
            <Button
              data-testid="attach-button"
              type="button"
              disabled={status !== "ready"}
              size="icon"
              variant="outline"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="relative"
              aria-label="Attach files"
            >
              {files && files?.length > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 z-10 shadow-md"
                >
                  {files?.length}
                </Badge>
              )}
              <PaperclipIcon />
            </Button>
          </div>
          <div>
            {status === "streaming" ? (
              <Button
                variant="destructive"
                type="button"
                size="icon"
                onClick={() => stop()}
                aria-label="Stop response"
              >
                <SquareIcon />
              </Button>
            ) : (
              <Button
                data-testid="send-button"
                type="submit"
                size="icon"
                disabled={status !== "ready" || (isEmpty && !files)}
                aria-label="Send message"
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
    </div>
  );
};

MainChatInput.displayName = "MainChatInput";
