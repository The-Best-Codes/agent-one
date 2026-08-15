import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconFilePlus,
  IconX,
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import type { ToolUIPart } from "ai";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { useTheme } from "@/hooks/use-theme";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { getLanguageExtension } from "@/lib/syntax-highlighter/language-extensions";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface CreateFileInput {
  filePath: string;
  content: string;
  overwrite?: boolean;
}

interface CreateFileOutput {
  overwritten?: boolean;
}

interface CreateFileToolPartProps {
  part: ToolUIPart;
}

const ContentPreview = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const { resolvedTheme } = useTheme();
  const [langExt, setLangExt] = useState<Extension | null>(null);

  useEffect(() => {
    void getLanguageExtension(filePath).then(setLangExt);
  }, [filePath]);

  return (
    <div className="max-h-72 w-full overflow-auto">
      <CodeMirror
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        value={content}
        className="w-full"
        extensions={[
          EditorView.editable.of(false),
          EditorView.lineWrapping,
          ...(langExt ? [langExt] : []),
        ]}
        readOnly={true}
      />
    </div>
  );
});

ContentPreview.displayName = "ContentPreview";

export const MessagePartToolCreateFile = ({ part }: CreateFileToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as CreateFileInput;
  const output = part.output as CreateFileOutput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const filePath = input?.filePath || t("tools.unknownFile");

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconFilePlus className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {input?.overwrite ? t("tools.wantsToOverwrite") : t("tools.wantsToCreate")}{" "}
              <span className="font-mono text-xs">{filePath}</span>
            </span>
          </div>
          {input?.content && (
            <div className="border-border overflow-hidden rounded border">
              <ContentPreview content={input.content} filePath={filePath} />
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              {t("common.deny")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              {t("common.approve")}
            </Button>
          </div>
        </div>
      );

    case "output-denied":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">
            {t("tools.fileCreationDenied", { path: filePath })}
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            {t("tools.preparingCreateFile")}
          </span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.fileCreationDenied", { path: filePath })}
            </span>
          </div>
        );
      }
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">{t("tools.creatingFile", { path: filePath })}</span>
        </div>
      );
    }

    case "output-available": {
      const content = input?.content;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/create-file-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconFilePlus
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-0 group-hover/create-file-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/create-file-accordion:scale-100 group-hover/create-file-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">
                {output.overwritten ? t("tools.overwrote") : t("tools.created")}{" "}
                <span className="font-mono text-xs">{filePath}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              {content ? (
                <div className="border-border w-full overflow-hidden rounded border">
                  <ContentPreview content={content} filePath={filePath} />
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">{t("tools.fileCreatedSuccess")}</div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.fileCreationCancelled")}
            </span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title={t("tools.createFileError")}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconFilePlus className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.fileCreated")}</span>
        </div>
      );
  }
};

MessagePartToolCreateFile.displayName = "MessagePartToolCreateFile";
