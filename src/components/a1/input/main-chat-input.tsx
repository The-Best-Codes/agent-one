"use client";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { IconArrowUp, IconPaperclip, IconPlayerStopFilled } from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatFunctions, useChatLoading, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { usePendingToolApproval } from "@/hooks/use-pending-tool-approval";
import { useTheme } from "@/hooks/use-theme";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
  inputStyleAtom,
  markdownHighlightingAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { kbdRegistry } from "@/lib/kbd-registry";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { ChatModelConfig } from "../chat-model-config";
import { ModelSelector } from "../chat-model-selector";
import { Attachments } from "./attachments";
import { MainInputErrorSection } from "./error-section";
import { MainInputIncompleteSection } from "./incomplete-section";
import { MainInputNoModelSection } from "./no-model-section";
import { MainInputProvisioningSection } from "./provisioning-section";

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
    color: "var(--foreground);",
  },
  ".cm-line": {
    padding: "0 0.125rem 0 0.625rem",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--primary) !important",
  },
});

export const MainChatInput = ({
  onScrollNeededAction,
  initialValue,
  disabled = false,
}: {
  onScrollNeededAction?: () => void;
  initialValue?: string;
  disabled?: boolean;
}) => {
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const { resolvedTheme } = useTheme();
  const { sendMessage, stop } = useChatFunctions();
  const { hasAvailableModels } = useModelCatalog();
  const hasPendingApproval = usePendingToolApproval();
  const markdownHighlighting = useAtomValue(markdownHighlightingAtom);
  const stopButtonBehavior = useAtomValue(stopButtonBehaviorAtom);
  const submitKey = useAtomValue(submitKeyAtom);
  const inputStyle = useAtomValue(inputStyleAtom);
  const { loadChatMessages } = usePersistence();
  const chatIds = useAtomValue(chatIdsAtom);
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

  useEffect(() => {
    if (initialValue) {
      editorViewRef.current?.dispatch({
        selection: { anchor: editorViewRef.current?.state.doc.length },
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEmpty(initialValue.trim().length === 0);
      editorViewRef.current?.focus();
    }
  }, [initialValue]);

  // TODO: Is a function acceptable to use here, e.g. a switch-case? Will be cleaner when we add more options
  const showStopButton =
    stopButtonBehavior === "immediate"
      ? status === "streaming" || status === "submitted"
      : status === "streaming";

  useHotkeys(kbdRegistry.focusMainChatInput, () => {
    editorViewRef.current?.focus();
  });

  const handleEditorChange = (newValue: string) => {
    const newIsEmpty = !newValue.trim();
    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
      logger.verbose("Editor content changed, isEmpty:", newIsEmpty);
    }
  };

  const submitMessage = () => {
    if (disabled) {
      return;
    }
    if (!hasAvailableModels) {
      logger.verbose("No models available, message submission aborted");
      return;
    }

    const currentText = editorViewRef.current?.state.doc.toString() || "";

    if ((currentText.trim() || files) && status === "ready" && !hasPendingApproval) {
      logger.verbose("Submitting message", {
        textLength: currentText.length,
        hasFiles: !!files,
        fileCount: files?.length || 0,
      });
      void sendMessage({
        text: currentText || "",
        files: files,
      });
      trackGoogleAnalyticsEvent("message_sent", {
        source: "main_chat_input",
        text_length: currentText.length,
        has_files: Boolean(files),
        file_count: files?.length ?? 0,
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
      onScrollNeededAction?.();
      logger.verbose("Message submitted successfully");
    } else {
      logger.verbose("Message submission blocked", {
        hasText: !!currentText.trim(),
        hasFiles: !!files,
        status,
      });
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  const addFiles = useCallback(
    (newFiles: FileList) => {
      if (!newFiles || newFiles.length === 0) {
        logger.verbose("No files to add");
        return;
      }

      const currentFiles = files ? Array.from(files) : [];
      const newFilesArray = Array.from(newFiles);

      logger.verbose("Adding files", {
        newFileCount: newFilesArray.length,
        currentFileCount: currentFiles.length,
        newFileNames: newFilesArray.map((f) => f.name),
      });

      const combined = [...currentFiles, ...newFilesArray];

      const uniqueFiles: File[] = [];
      const seen = new Set<string>();

      for (const file of combined) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFiles.push(file);
        }
      }

      const dt = new DataTransfer();
      uniqueFiles.forEach((file) => dt.items.add(file));
      const updatedFileList = dt.files;

      setFiles(updatedFileList.length > 0 ? updatedFileList : undefined);
      if (fileInputRef.current) {
        fileInputRef.current.files = updatedFileList;
      }

      trackGoogleAnalyticsEvent("files_attached", {
        source: "main_chat_input",
        file_count: updatedFileList.length,
      });

      logger.verbose("Files added successfully", {
        totalFileCount: updatedFileList.length,
      });
    },
    [files],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = e.target.files;
      logger.verbose("File input changed", {
        fileCount: newFiles.length,
        fileNames: Array.from(newFiles).map((f) => f.name),
      });
      setFiles(newFiles.length > 0 ? newFiles : undefined);
    } else {
      // Undesired behavior, so disabled for now
      // logger.verbose("File input cleared");
      // setFiles(undefined);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (!files) {
      logger.verbose("No files to remove");
      return;
    }

    const filesArray = Array.from(files);
    filesArray.splice(index, 1);

    const dt = new DataTransfer();
    filesArray.forEach((file) => dt.items.add(file));

    const newFileList = dt.files;
    setFiles(newFileList.length > 0 ? newFileList : undefined);

    trackGoogleAnalyticsEvent("attached_file_removed", {
      source: "main_chat_input",
      remaining_file_count: newFileList.length,
    });

    if (fileInputRef.current) {
      fileInputRef.current.files = newFileList;
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (
      e.dataTransfer.types.includes("Files") ||
      e.dataTransfer.types.includes("application/agent-one-chat")
    ) {
      logger.verbose("Drag enter detected, showing drop zone");
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // TODO: Consider using `relatedTarget` here
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      logger.verbose("Drag leave detected, hiding drop zone");
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChatDrop = useCallback(
    (chatId: string, title: string) => {
      if (!chatIds.includes(chatId)) {
        logger.error("Dropped chat does not exist", { chatId });
        return;
      }

      void loadChatMessages(chatId).then((messages) => {
        if (!messages || messages.length === 0) {
          logger.error("Dropped chat has no messages", { chatId });
          return;
        }

        const chatData = {
          id: chatId,
          title,
          info: "This chat was attached as a file by the user",
          messages,
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], {
          type: "application/json",
        });
        const file = new File(
          [blob],
          `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_agent-one_chat.txt`,
          {
            type: "text/plain",
          },
        );

        const dt = new DataTransfer();
        dt.items.add(file);
        const fileList = dt.files;

        logger.verbose("Chat exported and attached as file", {
          chatId,
          title,
          fileName: file.name,
        });
        addFiles(fileList);
      });
    },
    [loadChatMessages, chatIds, addFiles],
  );

  // Note: In src-tauri/tauri.conf.json, I set app.windows[0].dragDropEnabled to false to allow processing events in the JS here.
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        logger.verbose("Files dropped", {
          fileCount: e.dataTransfer.files.length,
          fileNames: Array.from(e.dataTransfer.files).map((f) => f.name),
        });
        addFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      } else {
        const chatData = e.dataTransfer.getData("application/agent-one-chat");
        if (chatData) {
          try {
            const { chatId, title } = JSON.parse(chatData);
            logger.verbose("AgentOne chat dropped", { chatId, title });
            handleChatDrop(chatId, title);
            e.dataTransfer.clearData();
          } catch (error) {
            logger.error("Failed to parse chat drop data", error);
          }
        } else {
          logger.verbose("Drop event with no files or chat data");
        }
      }
    },
    [addFiles, handleChatDrop],
  );

  const isFloating = inputStyle === "floating";

  return (
    <div className={cn(isFloating ? "px-2 pb-2" : "px-0 md:px-2")}>
      <MainInputProvisioningSection />
      <MainInputNoModelSection />
      <MainInputErrorSection onRetry={onScrollNeededAction} />
      <MainInputIncompleteSection onRetry={onScrollNeededAction} />
      <form
        data-testid="chat-form"
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "bg-secondary border-input focus-within:border-ring focus-within:ring-ring/50 relative flex w-full flex-col pt-2 pr-2",
          isFloating
            ? "rounded-md border focus-within:ring-[3px]"
            : "rounded-none border-0 border-t md:rounded-md md:rounded-b-none md:border md:border-b-0 md:focus-within:ring-[3px]",
        )}
      >
        {isDragging && (
          <div
            className={cn(
              "border-primary bg-background/80 absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed backdrop-blur-sm",
              isFloating ? "rounded-md" : "rounded-md rounded-b-none",
            )}
          >
            <p className="text-primary text-lg font-semibold">Drop files or chats to attach</p>
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
        {files && files.length > 0 && <Attachments files={files} onRemove={handleRemoveFile} />}
        <div className="grow overflow-hidden">
          <CodeMirror
            autoFocus
            editable={!disabled}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            // Note: Explicitly setting the value like this might prevent edits or input. It seems to be working fine, but if there are issues in the future, inspect this.
            value={initialValue || ""}
            minHeight="40px"
            maxHeight="160px"
            placeholder="Ask anything..."
            className="bg-transparent text-sm"
            extensions={[
              ...(markdownHighlighting ? [markdown({ base: markdownLanguage })] : []),
              editorTheme,
              EditorView.lineWrapping,
              EditorView.contentAttributes.of({
                spellcheck: "true",
                "aria-label": "Chat message input",
                "data-testid": "chat-editor",
              }),
              // eslint-disable-next-line react-hooks/refs
              EditorView.domEventHandlers({
                paste: (event) => {
                  if (disabled) {
                    return false;
                  }
                  const pastedFiles = event.clipboardData?.files;
                  if (pastedFiles && pastedFiles.length > 0) {
                    logger.verbose("Files pasted", {
                      fileCount: pastedFiles.length,
                      fileNames: Array.from(pastedFiles).map((f) => f.name),
                    });
                    addFiles(pastedFiles);
                    event.preventDefault();
                    return true;
                  }
                  return false;
                },
              }),
              Prec.highest(
                // eslint-disable-next-line react-hooks/refs
                keymap.of([
                  {
                    key: submitKey === "enter" ? "Enter" : "Ctrl-Enter",
                    run: (view) => {
                      if (view.composing) {
                        return false;
                      }
                      if (isMobile && submitKey === "enter") {
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
              if (initialValue) {
                view.dispatch({
                  selection: { anchor: view.state.doc.length },
                });
              }
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
        <div
          className={cn(
            "bg-secondary dark:bg-secondary flex items-center justify-between p-2 pr-0",
            isFloating ? "rounded-b-md" : "rounded-t-none rounded-b-md",
          )}
        >
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="attach-button"
                  type="button"
                  disabled={
                    disabled || status !== "ready" || !hasAvailableModels || hasPendingApproval
                  }
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  analytics={{
                    event: "attachment_picker_opened",
                    params: { source: "main_chat_input" },
                  }}
                  className="relative"
                  aria-label="Attach files"
                >
                  {files && files?.length > 0 && (
                    <Badge variant="default" className="absolute -top-2 -right-2 z-10 shadow-md">
                      {files?.length}
                    </Badge>
                  )}
                  <IconPaperclip />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files to your message</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-row">
              <ModelSelector
                loading={isChatLoading}
                className="w-60 min-w-0 flex-1 rounded-r-none"
                popoverClassName="w-60"
              />
              <ChatModelConfig
                disabled={isChatLoading}
                triggerClassName="rounded-l-none border-l-0"
              />
            </div>
            {showStopButton ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    type="button"
                    size="icon"
                    onClick={() => stop()}
                    analytics={{
                      event: "response_stop_clicked",
                      params: { source: "main_chat_input" },
                    }}
                    aria-label="Stop response"
                  >
                    <IconPlayerStopFilled />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop the current response</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-testid="send-button"
                    type="submit"
                    size="icon"
                    disabled={
                      disabled ||
                      status !== "ready" ||
                      (isEmpty && !files) ||
                      !hasAvailableModels ||
                      hasPendingApproval
                    }
                    analytics={{
                      event: "send_button_clicked",
                      params: { source: "main_chat_input" },
                    }}
                    aria-label="Send message"
                  >
                    {status === "submitted" ? <Spinner /> : <IconArrowUp />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send your message</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

MainChatInput.displayName = "MainChatInput";
