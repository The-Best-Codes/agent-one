"use client";
import { cn } from "@/lib/utils";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { memo, useRef } from "react";

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

interface InlineTextEditorProps {
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
  className?: string;
  onEnter?: () => void;
  disableEnter?: boolean;
  onCancel?: () => void;
}

const InlineTextEditorImpl = ({
  value,
  onChange,
  autoFocus,
  className,
  onEnter,
  disableEnter = false,
  onCancel,
}: InlineTextEditorProps) => {
  const { resolvedTheme } = useTheme();
  const editorViewRef = useRef<EditorView | null>(null);

  return (
    <CodeMirror
      value={value}
      autoFocus={autoFocus}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      minHeight="24px"
      className={cn("bg-transparent text-sm", className)}
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
                if (!disableEnter && onEnter) {
                  onEnter();
                  return true;
                }
                return false;
              },
            },
            {
              key: "Escape",
              run: () => {
                onCancel?.();
                return true;
              },
            },
          ]),
        ),
      ]}
      onChange={(v) => onChange(v)}
      onCreateEditor={(view) => {
        editorViewRef.current = view;
        if (autoFocus) {
          const len = view.state.doc.length;
          view.dispatch({
            selection: { anchor: len, head: len },
            scrollIntoView: true,
          });
          view.focus();
        }
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
  );
};

export const InlineTextEditor = memo(
  InlineTextEditorImpl,
  (prev, next) =>
    prev.value === next.value &&
    prev.autoFocus === next.autoFocus &&
    prev.className === next.className &&
    prev.disableEnter === next.disableEnter &&
    prev.onEnter === next.onEnter &&
    prev.onChange === next.onChange,
);

InlineTextEditor.displayName = "InlineTextEditor";
