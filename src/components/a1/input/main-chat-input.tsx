"use client";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { IconArrowUp, IconPaperclip, IconPlayerStopFilled } from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import { useAtomValue, useAtomValueRawSync } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useChatFunctions, useChatLoading, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { usePendingToolApproval } from "@/hooks/use-pending-tool-approval";
import { useTheme } from "@/hooks/use-theme";
import { loadChatInputDraft, saveChatInputDraft } from "@/lib/chat-input-drafts";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
  inputStyleAtom,
  interruptKeyAtom,
  markdownHighlightingAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import type { InterruptKeyOption, SubmitKeyOption } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

import { ChatModelConfig } from "../chat-model-config";
import { ModelSelector } from "../chat-model-selector";
import { Attachments } from "./attachments";
import { MainInputErrorSection } from "./error-section";
import { MainInputIncompleteSection } from "./incomplete-section";
import { MainInputNoModelSection } from "./no-model-section";
import { MainInputProvisioningSection } from "./provisioning-section";

const logger = getLogger(import.meta.url);

function getChatShortcut(key: SubmitKeyOption | InterruptKeyOption) {
  switch (key) {
    case "enter":
      return "Enter";
    case "ctrl-shift-enter":
      return "Mod-Shift-Enter";
    default:
      return "Mod-Enter";
  }
}

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
  initialValueKey,
  draftKey,
  disabled = false,
}: {
  onScrollNeededAction?: () => void;
  initialValue?: string;
  initialValueKey?: string;
  draftKey: string;
  disabled?: boolean;
}) => {
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const { resolvedTheme } = useTheme();
  const { sendMessage, stop } = useChatFunctions();
  const { currentModel } = useModel();
  const { hasAvailableModels, isModelCatalogLoading } = useModelCatalog();
  const hasPendingApproval = usePendingToolApproval();
  const markdownHighlighting = useAtomValue(markdownHighlightingAtom);
  const submitKey = useAtomValue(submitKeyAtom);
  const interruptKey = useAtomValue(interruptKeyAtom);
  const inputStyle = useAtomValue(inputStyleAtom);
  const { loadChatMessages } = usePersistence();
  const chatIds = useAtomValueRawSync(chatIdsAtom);
  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const [isEmpty, setIsEmpty] = useState(true);
  const [editorInitialValue] = useState(() => initialValue ?? loadChatInputDraft(draftKey));
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const editorViewRef = useRef<EditorView | null>(null);
  const initialValueKeyRef = useRef(initialValueKey);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);
  const isSubmittingRef = useRef(false);
  const statusRef = useRef(status);
  const readyResolverRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    statusRef.current = status;
    if (status === "ready") {
      readyResolverRef.current?.();
      readyResolverRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (initialValue) {
      const view = editorViewRef.current;
      if (view) {
        if (initialValueKeyRef.current !== initialValueKey) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: initialValue },
            selection: { anchor: initialValue.length },
          });
        } else {
          view.dispatch({ selection: { anchor: view.state.doc.length } });
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEmpty(initialValue.trim().length === 0);
      view?.focus();
    }
    initialValueKeyRef.current = initialValueKey;
  }, [initialValue, initialValueKey]);

  useEffect(() => {
    if (!disabled) {
      editorViewRef.current?.focus();
    }
  }, [disabled]);

  const showStopButton = status === "streaming" || status === "submitted";
  // TODO: Consider this approach in the future
  // const showInterruptButton = (status === "streaming" || status === "submitted") && (!isEmpty || !!files);
  const showInterruptButton = status === "streaming" && (!isEmpty || !!files);

  useKeyboardShortcut("focusMainChatInput", () => {
    editorViewRef.current?.focus();
  });

  useKeyboardShortcut("stopResponse", () => {
    if (status === "streaming" || status === "submitted") {
      void stop();
    }
  });

  const handleEditorChange = (newValue: string) => {
    saveChatInputDraft(draftKey, newValue);
    const newIsEmpty = !newValue.trim();
    if (newIsEmpty !== isEmpty) {
      setIsEmpty(newIsEmpty);
      logger.verbose("Editor content changed, isEmpty:", newIsEmpty);
    }
  };

  const submitMessage = async () => {
    if (disabled || isSubmittingRef.current) {
      return;
    }
    if (isModelCatalogLoading || !hasAvailableModels || !currentModel) {
      logger.verbose("No models available, message submission aborted");
      return;
    }

    const currentText = editorViewRef.current?.state.doc.toString() || "";

    if (
      (currentText.trim() || files) &&
      (status === "ready" || showInterruptButton) &&
      !hasPendingApproval
    ) {
      isSubmittingRef.current = true;
      logger.verbose("Submitting message", {
        textLength: currentText.length,
        hasFiles: !!files,
        fileCount: files?.length || 0,
      });
      try {
        if (showInterruptButton) {
          await stop();
          if (statusRef.current !== "ready") {
            await new Promise<void>((resolve) => {
              readyResolverRef.current = resolve;
            });
          }
        }
        void sendMessage({ text: currentText, files });
      } catch (error) {
        logger.error("Message submission failed", error);
        return;
      } finally {
        isSubmittingRef.current = false;
      }
      saveChatInputDraft(draftKey, "");
      trackGoogleAnalyticsEvent("message_sent", {
        ui_location: "main_chat_input",
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
    void submitMessage();
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
        ui_location: "main_chat_input",
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
      ui_location: "main_chat_input",
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
    <div className={cn(isFloating ? "px-0 pb-0 md:px-2 md:pb-2" : "px-0 md:px-2")}>
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
            ? "rounded-none border-0 border-t md:rounded-md md:border md:focus-within:ring-[3px]"
            : "rounded-none border-0 border-t md:rounded-md md:rounded-b-none md:border md:border-b-0 md:focus-within:ring-[3px]",
        )}
      >
        {isDragging && (
          <div
            className={cn(
              "border-primary bg-background/80 absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed backdrop-blur-sm",
              isFloating ? "rounded-none md:rounded-md" : "rounded-md rounded-b-none",
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
            value={editorInitialValue}
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
                    key: getChatShortcut(showInterruptButton ? interruptKey : submitKey),
                    run: (view) => {
                      if (view.composing) {
                        return false;
                      }
                      if (
                        isMobile &&
                        (showInterruptButton ? interruptKey : submitKey) === "enter"
                      ) {
                        return false;
                      }
                      void submitMessage();
                      return true;
                    },
                  },
                ]),
              ),
            ]}
            onChange={handleEditorChange}
            onCreateEditor={(view) => {
              editorViewRef.current = view;
              if (editorInitialValue) {
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
        <div className="bg-secondary dark:bg-secondary flex items-center justify-between rounded-t-none rounded-b-md p-2 pr-0">
          <div className="relative">
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  data-testid="attach-button"
                  type="button"
                  disabled={
                    disabled ||
                    status !== "ready" ||
                    isModelCatalogLoading ||
                    !hasAvailableModels ||
                    !currentModel ||
                    hasPendingApproval
                  }
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  analytics={{
                    event: "attachment_picker_opened",
                    params: { ui_location: "main_chat_input" },
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
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent>Attach files to your message</AdaptiveTooltipContent>
            </AdaptiveTooltip>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-row">
              <ModelSelector
                loading={isChatLoading}
                className="w-40 min-w-0 flex-1 rounded-r-none sm:w-60"
                popoverClassName="w-60"
              />

              <ChatModelConfig
                disabled={isChatLoading}
                triggerClassName="rounded-l-none border-l-0"
              />
            </div>
            <ButtonGroup aria-label="Response actions">
              {showStopButton && (
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      type="button"
                      size="icon"
                      onClick={() => stop()}
                      analytics={{
                        event: "response_stop_clicked",
                        params: { ui_location: "main_chat_input" },
                      }}
                      aria-label="Stop response"
                    >
                      <IconPlayerStopFilled />
                    </Button>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent>Stop the current response</AdaptiveTooltipContent>
                </AdaptiveTooltip>
              )}
              {(!showStopButton || showInterruptButton) && (
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <Button
                      data-testid="send-button"
                      type="submit"
                      size="icon"
                      disabled={
                        disabled ||
                        (status !== "ready" && !showInterruptButton) ||
                        (isEmpty && !files) ||
                        isModelCatalogLoading ||
                        !hasAvailableModels ||
                        !currentModel ||
                        hasPendingApproval
                      }
                      analytics={{
                        event: showInterruptButton
                          ? "interrupt_button_clicked"
                          : "send_button_clicked",
                        params: { ui_location: "main_chat_input" },
                      }}
                      aria-label={
                        showInterruptButton ? "Interrupt and send message" : "Send message"
                      }
                    >
                      <IconArrowUp />
                    </Button>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent>
                    {showInterruptButton
                      ? "Stop the response and send your message"
                      : "Send your message"}
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
              )}
            </ButtonGroup>
          </div>
        </div>
      </form>
    </div>
  );
};

MainChatInput.displayName = "MainChatInput";
