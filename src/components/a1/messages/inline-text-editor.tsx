"use client";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useAtomValue } from "jotai";
import { memo, useRef } from "react";

import { useTheme } from "@/hooks/use-theme";
import {
  markdownHighlightingAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

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
  ".cm-cursor": {
    borderLeftColor: "var(--primary) !important",
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
  const markdownHighlighting = useAtomValue(markdownHighlightingAtom);
  const submitKey = useAtomValue(submitKeyAtom);
  const editorViewRef = useRef<EditorView | null>(null);

  return (
    <CodeMirror
      value={value}
      autoFocus={autoFocus}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      minHeight="20px"
      maxHeight="384px"
      className={cn("bg-transparent text-sm", className)}
      extensions={[
        ...(markdownHighlighting ? [markdown({ base: markdownLanguage })] : []),
        editorTheme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ spellcheck: "true" }),
        Prec.highest(
          keymap.of([
            {
              key: submitKey === "enter" ? "Enter" : "Ctrl-Enter",
              run: (view) => {
                if (view.composing) {
                  return false;
                }
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
    prev.onChange === next.onChange &&
    prev.onCancel === next.onCancel,
);

InlineTextEditor.displayName = "InlineTextEditor";
