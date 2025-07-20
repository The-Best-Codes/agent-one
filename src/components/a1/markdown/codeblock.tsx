import { CopyButton } from "@/components/a1/copy-button";
import type { Extension } from "@codemirror/state";
import { githubDark } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { memo, useEffect, useState } from "react";

type CodeBlockProps = {
  content: string;
  lang?: string;
};

export const CodeBlock = memo(
  ({ content, lang }: CodeBlockProps) => {
    const [dynamicLangExtension, setDynamicLangExtension] = useState<
      Extension[]
    >([]);

    useEffect(() => {
      const loadLanguage = async () => {
        let extension: Extension | Extension[] = [];
        try {
          switch (lang) {
            case "js":
            case "javascript":
              const { javascript } = await import(
                "@codemirror/lang-javascript"
              );
              extension = javascript({ jsx: false, typescript: false });
              break;
            case "jsx":
              const { javascript: jsxLang } = await import(
                "@codemirror/lang-javascript"
              );
              extension = jsxLang({ jsx: true, typescript: false });
              break;
            case "ts":
            case "typescript":
              const { javascript: tsLang } = await import(
                "@codemirror/lang-javascript"
              );
              extension = tsLang({ typescript: true, jsx: false });
              break;
            case "tsx":
              const { javascript: tsxLang } = await import(
                "@codemirror/lang-javascript"
              );
              extension = tsxLang({ typescript: true, jsx: true });
              break;
            case "html":
              const { html } = await import("@codemirror/lang-html");
              extension = html();
              break;
            case "css":
              const { css } = await import("@codemirror/lang-css");
              extension = css();
              break;
            case "json":
              const { json } = await import("@codemirror/lang-json");
              extension = json();
              break;
            case "py":
            case "python":
              const { python } = await import("@codemirror/lang-python");
              extension = python();
              break;
            case "java":
              const { java } = await import("@codemirror/lang-java");
              extension = java();
              break;
            case "cpp":
            case "c++":
              const { cpp } = await import("@codemirror/lang-cpp");
              extension = cpp();
              break;
            case "go":
              const { go } = await import("@codemirror/lang-go");
              extension = go();
              break;
            case "rs":
            case "rust":
              const { rust } = await import("@codemirror/lang-rust");
              extension = rust();
              break;
            case "php":
              const { php } = await import("@codemirror/lang-php");
              extension = php();
              break;
            case "md":
            case "mdx":
            case "markdown":
              const { markdown, markdownLanguage } = await import(
                "@codemirror/lang-markdown"
              );
              const { languages } = await import("@codemirror/language-data");
              extension = markdown({
                base: markdownLanguage,
                codeLanguages: languages,
              });
              break;
            default:
              extension = [];
          }
        } catch (error) {
          console.error(
            `Failed to load CodeMirror language extension for "${lang}":`,
            error,
          );
          extension = [];
        }
        setDynamicLangExtension(
          Array.isArray(extension) ? extension : [extension],
        );
      };

      loadLanguage();
    }, [lang]);

    return (
      <div
        className="not-prose text-sm min-w-0 rounded-md"
        style={{ clipPath: "inset(0 round 0.375rem)" }}
      >
        {/* TODO: Change the background color based on if this codeblock is in a user or assistant message (and provide a prop to remove the bg too) */}
        <div className="sticky bg-secondary top-0 z-10">
          <div className="flex rounded-t-md items-center justify-between bg-[#0d1117] text-xs p-0">
            <span className="ml-2 font-mono text-white">
              {lang || "unknown"}
            </span>
            <CopyButton
              className="bg-[#0d1117] hover:bg-[#0d1117] text-white"
              text={content}
            />
          </div>
        </div>
        <div className="overflow-auto rounded-b-md">
          <CodeMirror
            value={content}
            theme={githubDark}
            extensions={dynamicLangExtension}
            editable={false}
            readOnly={true}
            basicSetup={{
              lineNumbers: false, // Allow changing in settings when settings are implemented?
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
        </div>
      </div>
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
