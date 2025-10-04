/* cspell:ignore Prec */
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Extension, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useMemo } from "react";

import { getLogger } from "@/lib/logger";
import { Settings } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const useCodeMirrorExtensions = ({
  settings,
  addFiles,
  submitMessage,
  isMobile,
}: {
  settings: Settings;
  addFiles: (files: FileList) => void;
  submitMessage: () => void;
  isMobile: boolean;
}) => {
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

  const extensions: Extension[] = useMemo(() => {
    const pasteEventHandler = EditorView.domEventHandlers({
      paste: (event) => {
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
    });

    const submitKeymap = Prec.highest(
      keymap.of([
        {
          key: settings.SUBMIT_KEY.value === "enter" ? "Enter" : "Ctrl-Enter",
          run: () => {
            if (isMobile && settings.SUBMIT_KEY.value === "enter") {
              return false;
            }
            submitMessage();
            return true;
          },
        },
      ]),
    );

    return [
      ...(settings.MARKDOWN_HIGHLIGHTING.value
        ? [markdown({ base: markdownLanguage })]
        : []),
      editorTheme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        spellcheck: "true",
        "aria-label": "Chat message input",
        "data-testid": "chat-editor",
      }),
      pasteEventHandler,
      submitKeymap,
    ];
  }, [
    settings.MARKDOWN_HIGHLIGHTING.value,
    addFiles,
    submitMessage,
    isMobile,
    settings.SUBMIT_KEY.value,
    editorTheme,
  ]);

  return extensions;
};
