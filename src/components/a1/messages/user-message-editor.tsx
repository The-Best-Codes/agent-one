import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { IconCheck, IconChevronDown, IconRefresh, IconX } from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import type { UIMessage } from "ai";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetChatFunctions } from "@/contexts/use-chat/chat-hooks";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { useTheme } from "@/hooks/use-theme";
import {
  markdownHighlightingAtom,
  regenerateOnSaveAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

import { MessagePartFile } from "./parts/file";

const logger = getLogger(import.meta.url);

const editorTheme = EditorView.theme({
  "&": { border: "none", backgroundColor: "transparent !important" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "inherit" },
  ".cm-content": {
    paddingTop: "0px",
    paddingBottom: "0px",
    color: "var(--foreground);",
  },
  ".cm-line": { padding: "0 0.125rem 0 0.125rem" },
  ".cm-cursor": { borderLeftColor: "var(--primary) !important" },
});

export function UserMessageEditor({
  message,
  onClose,
}: {
  message: UIMessage;
  onClose: () => void;
}) {
  const [text, setText] = useState(
    () => message.parts.find((part) => part.type === "text")?.text ?? "",
  );
  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);
  const markdownHighlighting = useAtomValue(markdownHighlightingAtom);
  const submitKey = useAtomValue(submitKeyAtom);
  const { resolvedTheme } = useTheme();
  const isMobile = useMobileDetection({ anyHover: true, pointerCoarse: true, match: "all" });
  const getChatFunctions = useGetChatFunctions();
  const files = message.parts.filter((part) => part.type === "file");

  const handleSave = () => {
    if (!text.trim() && files.length === 0) return;

    try {
      getChatFunctions().setMessages((messages) =>
        messages.map((currentMessage) => {
          if (currentMessage.id !== message.id) return currentMessage;

          const textIndex = currentMessage.parts.findIndex((part) => part.type === "text");
          const textPart = currentMessage.parts[textIndex];
          if (textPart?.type !== "text") return currentMessage;

          const parts = [...currentMessage.parts];
          parts[textIndex] = { ...textPart, text };
          return { ...currentMessage, parts };
        }),
      );
      onClose();
      if (regenerateOnSave) {
        void getChatFunctions().regenerate({ messageId: message.id });
      }
    } catch (error) {
      logger.error(error);
    }
  };

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 bg-background mt-2 ml-2 flex w-full max-w-3/4 flex-col gap-2 self-end rounded-md border p-2 focus-within:ring-[3px]">
      <CodeMirror
        value={text}
        autoFocus
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        minHeight="20px"
        maxHeight="384px"
        className="bg-transparent text-sm"
        extensions={[
          ...(markdownHighlighting ? [markdown({ base: markdownLanguage })] : []),
          editorTheme,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ spellcheck: "true", "aria-label": "Edit message" }),
          Prec.highest(
            keymap.of([
              {
                key: submitKey === "enter" ? "Enter" : "Mod-Enter",
                run: (view) => {
                  if (view.composing || isMobile) return false;
                  handleSave();
                  return true;
                },
              },
              {
                key: "Escape",
                run: () => {
                  onClose();
                  return true;
                },
              },
            ]),
          ),
        ]}
        onChange={setText}
        onCreateEditor={(view) => {
          const length = view.state.doc.length;
          view.dispatch({ selection: { anchor: length }, scrollIntoView: true });
          view.focus();
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
      {files.map((file, index) => (
        <MessagePartFile key={`${message.id}-file-${index}`} file={file} />
      ))}
      <div className="flex items-center justify-end gap-1.5">
        <Button size="xs" variant="outline" onClick={onClose}>
          <IconX data-icon="inline-start" />
          Cancel
        </Button>
        <ButtonGroup>
          <Button
            size="xs"
            variant={regenerateOnSave ? "destructive" : "default"}
            onClick={handleSave}
            disabled={!text.trim() && files.length === 0}
          >
            {regenerateOnSave ? (
              <IconRefresh data-icon="inline-start" />
            ) : (
              <IconCheck data-icon="inline-start" />
            )}
            Save {regenerateOnSave ? "and restart from here" : ""}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant={regenerateOnSave ? "destructive" : "default"}
                aria-label="More options"
              >
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-max">
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  id="regenerate-on-save"
                  checked={regenerateOnSave}
                  onCheckedChange={(checked) => setRegenerateOnSave(checked === true)}
                >
                  Regenerate when saved
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>
    </div>
  );
}
