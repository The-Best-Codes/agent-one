import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { memo } from "react";

export const PerformantMarkdown = memo(({ content }: { content: string }) => {
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
      padding: "0px",
    },
  });

  return (
    <CodeMirror
      autoFocus
      defaultValue={content || "No content detected to display"}
      minHeight="16px"
      maxHeight="384px"
      minWidth="100%"
      className="bg-transparent text-sm"
      extensions={[
        markdown({ base: markdownLanguage }),
        editorTheme,
        EditorView.lineWrapping,
      ]}
      readOnly={true}
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
});

PerformantMarkdown.displayName = "PerformantMarkdown";
