import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { memo } from "react";

import { useSettings } from "@/contexts/use-settings/settings-hooks";

export const PerformantMarkdown = memo(({ content }: { content: string }) => {
  const { resolvedTheme } = useTheme();
  const { settings } = useSettings();
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
      color: "var(--foreground);",
    },
  });

  return (
    <div className="overflow-hidden">
      <CodeMirror
        autoFocus
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        value={content || "No content detected to display"}
        maxHeight="384px"
        className="w-full bg-transparent text-sm"
        extensions={[
          ...(settings.MARKDOWN_HIGHLIGHTING.value ? [markdown({ base: markdownLanguage })] : []),
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
