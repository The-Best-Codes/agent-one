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
    <div className="overflow-hidden">
      <CodeMirror
        autoFocus
        theme="light" // TODO: Base this off of real theme, next-themes for example
        value={content || "No content detected to display"}
        maxHeight="384px"
        className="bg-transparent text-sm w-full"
        extensions={[
          markdown({ base: markdownLanguage }),
          editorTheme,
          EditorView.lineWrapping,
          EditorView.editable.of(false),
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
    </div>
  );
});

PerformantMarkdown.displayName = "PerformantMarkdown";
