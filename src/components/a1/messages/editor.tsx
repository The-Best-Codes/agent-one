"use client";
import { Button } from "@/components/ui/button";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { cn } from "@/lib/utils";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import type { UIMessage } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";

const editorTheme = EditorView.theme({
  "&": {
    border: "none",
    backgroundColor: "transparent !important",
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
    padding: "0 0.125rem 0 0.125rem",
  },
});

interface MessageEditorProps {
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  messageRole: UIMessage["role"];
  className?: string;
}

export const MessageEditor = ({
  initialContent,
  onSave,
  onCancel,
  messageRole,
  className,
}: MessageEditorProps) => {
  const editorViewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();
  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const handleSave = () => {
    const currentContent = editorViewRef.current?.state.doc.toString() || "";

    if (currentContent.trim()) {
      onSave(currentContent);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col p-2 border border-input rounded-md focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 bg-background",
        className,
      )}
    >
      <CodeMirror
        value={initialContent}
        autoFocus
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        minHeight="40px"
        maxHeight="400px"
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
                  if (isMobile) {
                    return false;
                  }
                  handleSave();
                  return true;
                },
              },
              {
                key: "Escape",
                run: () => {
                  onCancel();
                  return true;
                },
              },
            ]),
          ),
        ]}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
          view.dispatch({
            selection: {
              anchor: view.state.doc.length,
              head: view.state.doc.length,
            },
            scrollIntoView: true,
          });
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
      <div className="flex justify-end items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
          onClick={onCancel}
        >
          <XIcon className="size-4" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
          onClick={handleSave}
        >
          <CheckIcon className="size-4" />
          {messageRole === "user" ? "Save & Regenerate" : "Save"}
        </Button>
      </div>
    </div>
  );
};

MessageEditor.displayName = "MessageEditor";
