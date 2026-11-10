"use client";
import { completionStatus } from "@codemirror/autocomplete";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { IconArrowUp, IconPaperclip, IconPlayerStopFilled } from "@tabler/icons-react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import CodeMirror from "@uiw/react-codemirror";
import { useAtomValue, useAtomValueRawSync } from "jotai";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useChatFunctions, useChatLoading, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { getToolBehavior, useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { useNativeFileDrop } from "@/hooks/use-native-file-drop";
import { usePendingToolApproval } from "@/hooks/use-pending-tool-approval";
import { useTheme } from "@/hooks/use-theme";
import { createAttachmentPath, writeAttachmentFile } from "@/lib/attachments";
import { loadChatInputDraft, saveChatInputDraft } from "@/lib/chat-input-drafts";
import { formatChatMention } from "@/lib/chat-mentions";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import type { SettingValue } from "@/lib/settings/definitions";
import type { Project } from "@/lib/storage/project-storage";
import { cn } from "@/lib/utils";

import { ChatModelConfig } from "../chat-model-config";
import { ModelSelector } from "../chat-model-selector";
import { ShortcutKbd, ShortcutKeys } from "../shortcut-kbd";
import {
  createChatInputMentions,
  markAttachmentSaved,
  savingAttachmentPaths,
} from "./chat-input-mentions";
import { MainInputErrorSection } from "./error-section";
import { MainInputIncompleteSection } from "./incomplete-section";
import { MainInputNoModelSection } from "./no-model-section";
import { MainInputProvisioningSection } from "./provisioning-section";

const logger = getLogger(import.meta.url);

const DRAFT_SAVE_DELAY_MS = 300;
const CAN_PICK_FILE_PATHS = !["android", "ios"].includes(platform());

function getAttachmentText(path: string) {
  return formatChatMention({ kind: "attachment", path });
}

const EDITOR_BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  highlightSelectionMatches: false,
  autocompletion: false,
  searchKeymap: false,
  lintKeymap: false,
  completionKeymap: false,
};

function isFileDrag(dataTransfer: DataTransfer | null) {
  return dataTransfer?.types.includes("Files") ?? false;
}

function isChatDrag(dataTransfer: DataTransfer | null) {
  return dataTransfer?.types.includes("application/agent-one-chat") ?? false;
}

function getChatShortcut(key: SettingValue<"SUBMIT_KEY" | "INTERRUPT_KEY">) {
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
  toolbarStart,
  getProject,
}: {
  onScrollNeededAction?: () => void;
  initialValue?: string;
  initialValueKey?: string;
  draftKey: string;
  disabled?: boolean;
  toolbarStart?: ReactNode;
  getProject?: () => Project | undefined;
}) => {
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const { resolvedTheme } = useTheme();
  const { sendMessage, stop } = useChatFunctions();
  const { currentModel, currentModelConfig } = useModel();
  const toolsDisabled = getToolBehavior(currentModelConfig) === "disable";
  const { hasAvailableModels, isModelCatalogLoading } = useModelCatalog();
  const hasPendingApproval = usePendingToolApproval();
  const markdownHighlighting = useAtomValue(settingAtoms.MARKDOWN_HIGHLIGHTING);
  const fileMentionCompletions = useAtomValue(settingAtoms.FILE_MENTION_COMPLETIONS);
  const skillCompletions = useAtomValue(settingAtoms.SKILL_COMPLETIONS);
  const submitKey = useAtomValue(settingAtoms.SUBMIT_KEY);
  const interruptKey = useAtomValue(settingAtoms.INTERRUPT_KEY);
  const inputStyle = useAtomValue(settingAtoms.INPUT_STYLE);
  const { loadChatMessages } = usePersistence();
  const chatIds = useAtomValueRawSync(chatIdsAtom);
  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const [isEmpty, setIsEmpty] = useState(true);
  const [savingPaths, setSavingPaths] = useState<string[]>([]);
  const [isInterruptSubmitting, setIsInterruptSubmitting] = useState(false);
  const [editorInitialValue] = useState(() => initialValue ?? loadChatInputDraft(draftKey));
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isEditorOverflowing, setIsEditorOverflowing] = useState(false);

  const editorViewRef = useRef<EditorView | null>(null);
  const initialValueKeyRef = useRef(initialValueKey);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileDragCounter = useRef(0);
  const chatDragCounter = useRef(0);
  const isSubmittingRef = useRef(false);
  const hasSentInterruptRef = useRef(false);
  const statusRef = useRef(status);
  const readyResolverRef = useRef<(() => void) | null>(null);
  const pendingDraftRef = useRef<{ key: string; text: string } | null>(null);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    statusRef.current = status;
    if (status === "ready") {
      readyResolverRef.current?.();
      readyResolverRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (
      isInterruptSubmitting &&
      hasSentInterruptRef.current &&
      (status === "error" || (isEmpty && (status === "submitted" || status === "streaming")))
    ) {
      setIsInterruptSubmitting(false);
    }
  }, [isInterruptSubmitting, isEmpty, status]);

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

  const showStopButton = status === "streaming" || status === "submitted" || isInterruptSubmitting;
  // TODO: Consider this approach in the future
  // const showInterruptButton = (status === "streaming" || status === "submitted") && !isEmpty;
  const showInterruptButton = status === "streaming" && !isEmpty && !isInterruptSubmitting;

  useKeyboardShortcut("focusMainChatInput", () => {
    editorViewRef.current?.focus();
  });

  useKeyboardShortcut("stopResponse", () => {
    if (status === "streaming" || status === "submitted") {
      void stop();
    }
  });

  const cancelDraftSave = useCallback(() => {
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = null;
    }
    pendingDraftRef.current = null;
  }, []);

  const flushDraftSave = useCallback(() => {
    const pendingDraft = pendingDraftRef.current;
    cancelDraftSave();
    if (pendingDraft) {
      saveChatInputDraft(pendingDraft.key, pendingDraft.text);
    }
  }, [cancelDraftSave]);

  useEffect(() => flushDraftSave, [draftKey, flushDraftSave]);

  const handleEditorChange = (newValue: string) => {
    pendingDraftRef.current = { key: draftKey, text: newValue };
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    draftSaveTimeoutRef.current = setTimeout(flushDraftSave, DRAFT_SAVE_DELAY_MS);
    if (savingPaths.length > 0) {
      setSavingPaths((paths) => paths.filter((path) => newValue.includes(getAttachmentText(path))));
    }
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
      currentText.trim() &&
      savingPaths.length === 0 &&
      (status === "ready" || showInterruptButton) &&
      !hasPendingApproval
    ) {
      isSubmittingRef.current = true;
      logger.verbose("Submitting message", {
        textLength: currentText.length,
      });
      try {
        if (showInterruptButton) {
          hasSentInterruptRef.current = false;
          setIsInterruptSubmitting(true);
          await stop();
          if (statusRef.current !== "ready") {
            await new Promise<void>((resolve) => {
              readyResolverRef.current = resolve;
            });
          }
        }
        if (showInterruptButton) {
          hasSentInterruptRef.current = true;
        }
        void sendMessage({ text: currentText }).catch((error: unknown) => {
          hasSentInterruptRef.current = false;
          setIsInterruptSubmitting(false);
          logger.error("Message submission failed", error);
        });
      } catch (error) {
        hasSentInterruptRef.current = false;
        setIsInterruptSubmitting(false);
        logger.error("Message submission failed", error);
        return;
      } finally {
        isSubmittingRef.current = false;
      }
      cancelDraftSave();
      saveChatInputDraft(draftKey, "");

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
      onScrollNeededAction?.();
      logger.verbose("Message submitted successfully");
    } else {
      logger.verbose("Message submission blocked", {
        hasText: !!currentText.trim(),
        status,
      });
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitMessage();
  };

  const insertMentions = useCallback((text: string) => {
    const view = editorViewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const before = view.state.sliceDoc(from - 1, from);
    const insert = `${before && !/\s/.test(before) ? " " : ""}${text} `;
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
      userEvent: "input",
    });
    view.focus();
  }, []);

  const attachPaths = useCallback(
    (paths: string[]) => insertMentions(paths.map(getAttachmentText).join(" ")),
    [insertMentions],
  );
  useNativeFileDrop(setIsDraggingFiles, attachPaths);

  const removeAttachmentMention = useCallback((path: string) => {
    const view = editorViewRef.current;
    const text = getAttachmentText(path);
    const from = view?.state.doc.toString().indexOf(text) ?? -1;
    if (!view || from === -1) return;
    const to = from + text.length;
    view.dispatch({ changes: { from, to: view.state.sliceDoc(to, to + 1) === " " ? to + 1 : to } });
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList) => {
      const files = Array.from(newFiles);
      if (files.length === 0) return;
      logger.verbose("Adding files", { fileNames: files.map((file) => file.name) });
      void (async () => {
        const paths = await Promise.all(files.map(createAttachmentPath));
        paths.forEach((path) => savingAttachmentPaths.add(path));
        setSavingPaths((current) => [...current, ...paths]);
        insertMentions(paths.map(getAttachmentText).join(" "));
        await Promise.all(
          files.map(async (file, index) => {
            const path = paths[index];
            try {
              await writeAttachmentFile(path, file);
            } catch (error) {
              logger.error("Failed to attach file", error);
              toast.error(`Couldn't attach ${file.name}.`);
              removeAttachmentMention(path);
            } finally {
              markAttachmentSaved(editorViewRef.current, path);
              setSavingPaths((current) => current.filter((item) => item !== path));
            }
          }),
        );
      })().catch((error: unknown) => {
        logger.error("Failed to attach files", error);
        toast.error("Couldn't attach files.");
      });
    },
    [insertMentions, removeAttachmentMention],
  );

  const handleAttachClick = async () => {
    if (!CAN_PICK_FILE_PATHS) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const paths = await openFileDialog({ multiple: true });
      if (paths && paths.length > 0) {
        attachPaths(paths);
      }
    } catch (error) {
      logger.error("Failed to pick files", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isChatDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.stopPropagation();
    chatDragCounter.current++;
    logger.verbose("Chat drag enter detected, showing drop zone");
    setIsDraggingChat(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isChatDrag(e.dataTransfer)) return;
    // TODO: Consider using `relatedTarget` here
    e.preventDefault();
    e.stopPropagation();
    chatDragCounter.current--;
    if (chatDragCounter.current === 0) {
      logger.verbose("Chat drag leave detected, hiding drop zone");
      setIsDraggingChat(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isChatDrag(e.dataTransfer)) return;
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

        insertMentions(formatChatMention({ kind: "chat", value: chatId, label: title }));
      });
    },
    [loadChatMessages, chatIds, insertMentions],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isChatDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingChat(false);
      chatDragCounter.current = 0;
      const chatData = e.dataTransfer.getData("application/agent-one-chat");
      try {
        const { chatId, title } = JSON.parse(chatData);
        logger.verbose("AgentOne chat dropped", { chatId, title });
        handleChatDrop(chatId, title);
      } catch (error) {
        logger.error("Failed to parse chat drop data", error);
      }
    },
    [handleChatDrop],
  );

  // Note: In src-tauri/tauri.conf.json, I set app.windows[0].dragDropEnabled to false to allow processing events in the JS here.
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      fileDragCounter.current++;
      if (fileDragCounter.current === 1) {
        logger.verbose("File drag enter detected, showing drop zone");
        setIsDraggingFiles(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      fileDragCounter.current = Math.max(0, fileDragCounter.current - 1);
      if (fileDragCounter.current === 0) {
        logger.verbose("File drag leave detected, hiding drop zone");
        setIsDraggingFiles(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };

    const handleWindowDrop = (e: DragEvent) => {
      if (!isFileDrag(e.dataTransfer)) return;
      e.preventDefault();
      fileDragCounter.current = 0;
      setIsDraggingFiles(false);
      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        logger.verbose("Files dropped", {
          fileCount: droppedFiles.length,
          fileNames: Array.from(droppedFiles).map((f) => f.name),
        });
        addFiles(droppedFiles);
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [addFiles]);

  const isFloating = inputStyle === "floating";

  const chatShortcutKey = showInterruptButton ? interruptKey : submitKey;
  const editorHandlersRef = useRef({ disabled, isMobile, addFiles, submitMessage });
  useLayoutEffect(() => {
    editorHandlersRef.current = { disabled, isMobile, addFiles, submitMessage };
  });
  const [mentions] = useState(createChatInputMentions);
  useLayoutEffect(() => {
    mentions.setProjectGetter(getProject ?? (() => undefined));
  }, [mentions, getProject]);
  useLayoutEffect(() => {
    mentions.setTriggers({ files: fileMentionCompletions, skills: skillCompletions });
  }, [mentions, fileMentionCompletions, skillCompletions]);

  const editorExtensions = useMemo(
    () => [
      ...(markdownHighlighting ? [markdown({ base: markdownLanguage })] : []),
      editorTheme,
      mentions.extension,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.geometryChanged) {
          const { scrollHeight, clientHeight } = update.view.scrollDOM;
          setIsEditorOverflowing(scrollHeight > clientHeight);
        }
      }),
      EditorView.contentAttributes.of({
        spellcheck: "true",
        "aria-label": "Chat message input",
        "data-testid": "chat-editor",
      }),
      // eslint-disable-next-line react-hooks/refs
      EditorView.domEventHandlers({
        paste: (event) => {
          if (editorHandlersRef.current.disabled) {
            return false;
          }
          const pastedFiles = event.clipboardData?.files;
          if (pastedFiles && pastedFiles.length > 0) {
            logger.verbose("Files pasted", {
              fileCount: pastedFiles.length,
              fileNames: Array.from(pastedFiles).map((f) => f.name),
            });
            editorHandlersRef.current.addFiles(pastedFiles);
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
            key: getChatShortcut(chatShortcutKey),
            run: (view) => {
              if (view.composing || completionStatus(view.state) === "active") {
                return false;
              }
              if (editorHandlersRef.current.isMobile && chatShortcutKey === "enter") {
                return false;
              }
              void editorHandlersRef.current.submitMessage();
              return true;
            },
          },
        ]),
      ),
    ],
    [markdownHighlighting, chatShortcutKey, mentions],
  );

  return (
    <div className={cn(isFloating ? "px-0 pb-0 md:px-2 md:pb-2" : "px-0 md:px-2")}>
      <MainInputProvisioningSection />
      <MainInputNoModelSection />
      <MainInputErrorSection onRetry={onScrollNeededAction} />
      <MainInputIncompleteSection onRetry={onScrollNeededAction} />
      <form
        data-testid="chat-form"
        data-tour="chat-input"
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
        {(isDraggingFiles || isDraggingChat) && (
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
        />
        <div className="min-w-0 grow">
          <CodeMirror
            autoFocus
            editable={!disabled}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            // Note: Explicitly setting the value like this might prevent edits or input. It seems to be working fine, but if there are issues in the future, inspect this.
            value={editorInitialValue}
            minHeight="40px"
            maxHeight="160px"
            placeholder="Ask anything..."
            className={cn(
              "[&_.cm-scroller]:no-scrollbar bg-transparent text-sm",
              isEditorOverflowing &&
                "[&_.cm-scroller]:scroll-fade [&_.cm-scroller]:[--scroll-fade-reveal:--spacing(6)]",
            )}
            extensions={editorExtensions}
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
            basicSetup={EDITOR_BASIC_SETUP}
          />
        </div>
        <div className="bg-secondary dark:bg-secondary flex items-center justify-between gap-2 rounded-t-none rounded-b-md p-2 pr-0">
          <div className="relative flex min-w-0 items-center gap-2">
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  data-testid="attach-button"
                  data-tour="attach"
                  type="button"
                  disabled={
                    disabled ||
                    status !== "ready" ||
                    isModelCatalogLoading ||
                    !hasAvailableModels ||
                    !currentModel ||
                    hasPendingApproval ||
                    toolsDisabled
                  }
                  size="icon"
                  variant="outline"
                  onClick={() => void handleAttachClick()}
                  aria-label="Attach files"
                >
                  <IconPaperclip />
                </Button>
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent>
                {toolsDisabled
                  ? "Turn on tools to attach files, so AgentOne can open them"
                  : "Attach files to your message"}
              </AdaptiveTooltipContent>
            </AdaptiveTooltip>
            {toolbarStart}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-row" data-tour="model-selector">
              <ModelSelector
                loading={isChatLoading}
                className="w-40 min-w-0 flex-1 shrink rounded-r-none sm:w-60"
                popoverClassName="w-60"
              />

              <ChatModelConfig
                disabled={isChatLoading}
                triggerClassName="rounded-l-none border-l-0"
              />
            </div>
            <div
              className={cn(
                "flex-none overflow-hidden rounded-lg transition-[width] duration-200 ease-in-out motion-reduce:transition-none",
                showInterruptButton ? "w-16" : "w-8",
              )}
            >
              <ButtonGroup
                aria-label="Response actions"
                className={cn(
                  "w-16 transition-transform duration-200 ease-in-out motion-reduce:transition-none",
                  !showStopButton && "-translate-x-8",
                )}
              >
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      type="button"
                      size="icon"
                      className="bg-clip-border"
                      disabled={!showStopButton}
                      aria-hidden={!showStopButton}
                      inert={!showStopButton}
                      onClick={() => stop()}
                      aria-label="Stop response"
                    >
                      <IconPlayerStopFilled />
                    </Button>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent>
                    Stop the current response
                    <ShortcutKbd id="stopResponse" />
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <Button
                      data-testid={showInterruptButton ? "interrupt-button" : "send-button"}
                      type="submit"
                      size="icon"
                      className={cn(
                        "bg-clip-border",
                        showInterruptButton && "border-l! border-l-secondary!",
                      )}
                      variant={showStopButton ? "destructive" : "default"}
                      aria-hidden={showStopButton && !showInterruptButton}
                      inert={showStopButton && !showInterruptButton}
                      disabled={
                        disabled ||
                        (status !== "ready" && !showInterruptButton) ||
                        isEmpty ||
                        savingPaths.length > 0 ||
                        isModelCatalogLoading ||
                        !hasAvailableModels ||
                        !currentModel ||
                        hasPendingApproval
                      }
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
                    {!(isMobile && chatShortcutKey === "enter") && (
                      <ShortcutKeys shortcut={getChatShortcut(chatShortcutKey)} />
                    )}
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

MainChatInput.displayName = "MainChatInput";
