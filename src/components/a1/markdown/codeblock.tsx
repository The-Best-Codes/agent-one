import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";
import { githubDark } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { memo, useMemo } from "react";

type CodeBlockProps = {
  content: string;
  lang?: string;
};

export const CodeBlock = memo(
  ({ content, lang }: CodeBlockProps) => {
    const extensions = useMemo(() => {
      let langExtension: Extension | Extension[];
      switch (lang) {
        case "js":
        case "javascript":
          langExtension = javascript({ jsx: false, typescript: false });
          break;
        case "jsx":
          langExtension = javascript({ jsx: true, typescript: false });
          break;
        case "ts":
        case "typescript":
          langExtension = javascript({ typescript: true, jsx: false });
          break;
        case "tsx":
          langExtension = javascript({ typescript: true, jsx: true });
          break;
        case "html":
          langExtension = html();
          break;
        case "css":
          langExtension = css();
          break;
        case "json":
          langExtension = json();
          break;
        case "python":
          langExtension = python();
          break;
        case "java":
          langExtension = java();
          break;
        case "cpp":
        case "c++":
          langExtension = cpp();
          break;
        case "go":
          langExtension = go();
          break;
        case "rust":
          langExtension = rust();
          break;
        case "php":
          langExtension = php();
          break;
        case "markdown":
          langExtension = markdown({
            base: markdownLanguage,
            codeLanguages: languages,
          });
          break;
        default:
          langExtension = [];
      }
      return Array.isArray(langExtension) ? langExtension : [langExtension];
    }, [lang]);

    return (
      <CodeMirror
        className="rounded-md not-prose text-sm"
        value={content}
        theme={githubDark}
        extensions={extensions}
        editable={false}
        readOnly={true}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          highlightSpecialChars: false,
          history: false,
          foldGutter: false,
          drawSelection: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          syntaxHighlighting: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          closeBracketsKeymap: false,
          searchKeymap: false,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.lang === nextProps.lang
    );
  },
);

CodeBlock.displayName = "CodeBlock";
