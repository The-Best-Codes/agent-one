import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconFileText,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface GetUrlContentInput {
  urls: string[];
  format: string;
  maxLength: number;
  timeoutSeconds?: number;
}

interface UrlResult {
  url: string;
  title?: string;
  content?: string;
  format?: string;
  length?: number;
  truncated?: boolean;
  error?: string;
  pending?: boolean;
}

interface GetUrlContentOutput {
  results?: UrlResult[];
}

interface GetUrlContentToolPartProps {
  part: ToolUIPart;
}

const formatUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    let formattedUrl = urlObj.hostname;
    if (urlObj.pathname !== "/") {
      formattedUrl += urlObj.pathname;
    }
    if (urlObj.search) {
      formattedUrl += urlObj.search;
    }
    if (formattedUrl.length > 50) {
      formattedUrl = formattedUrl.slice(0, 47) + "...";
    }
    return formattedUrl;
  } catch {
    return url;
  }
};

const UrlPendingDisplay = memo(({ url }: { url: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1">
      <Spinner className="text-foreground size-4 shrink-0" />
      <span className="text-foreground max-w-2xl truncate text-sm font-bold">
        {t("tools.browsing")}{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
        >
          {formatUrl(url)}
        </a>
        ...
      </span>
    </div>
  );
});

UrlPendingDisplay.displayName = "UrlPendingDisplay";

const UrlCancelledDisplay = memo(({ url }: { url: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1">
      <IconCircleX className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground max-w-2xl truncate text-sm font-bold">
        {t("tools.browsing")}{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
        >
          {formatUrl(url)}
        </a>{" "}
        {t("tools.cancelled")}
      </span>
    </div>
  );
});

UrlCancelledDisplay.displayName = "UrlCancelledDisplay";

const UrlResultDisplay = memo(
  ({ result, input }: { result: UrlResult; input: GetUrlContentInput }) => {
    const { t } = useTranslation();
    if (result.error) {
      return (
        <div className="flex items-center gap-1">
          <IconCircleX className="text-destructive size-4 shrink-0" />
          <span className="text-destructive max-w-2xl truncate text-sm font-bold">
            {t("tools.failedToBrowse")}{" "}
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
            >
              {formatUrl(result.url)}
            </a>
          </span>
        </div>
      );
    }

    const isRawContent = result.format === "raw" || result.format === "text";

    return (
      <div className="flex items-center gap-1">
        <IconWorld className="text-foreground size-4 shrink-0" />
        <span className="text-foreground max-w-2xl truncate text-sm font-bold">
          {t("tools.browsed")}{" "}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
          >
            {formatUrl(result.url)}
          </a>
        </span>
        <div className="flex items-center gap-1">
          <>
            {isRawContent && (
              <AdaptiveTooltip>
                <AdaptiveTooltipTrigger asChild>
                  <IconFileText className="text-muted-foreground size-4 shrink-0" />
                </AdaptiveTooltipTrigger>
                <AdaptiveTooltipContent>{t("tools.fetchedRaw")}</AdaptiveTooltipContent>
              </AdaptiveTooltip>
            )}
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <div
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    result.truncated ? "bg-yellow-500" : "bg-green-500",
                  )}
                />
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent>
                {result.truncated
                  ? t("tools.truncatedTo", { max: input.maxLength || t("common.unknown") })
                  : result.length
                    ? t("tools.charsProcessed", { count: result.length })
                    : t("tools.allCharsProcessed")}
              </AdaptiveTooltipContent>
            </AdaptiveTooltip>
          </>
        </div>
      </div>
    );
  },
);

UrlResultDisplay.displayName = "UrlResultDisplay";

export const MessagePartToolGetUrlContent = ({ part }: GetUrlContentToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as GetUrlContentInput;
  const output = part.output as GetUrlContentOutput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const urlCount = input?.urls?.length || 0;

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconWorld className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToBrowse")}
              {urlCount === 1 ? (
                <>
                  {" "}
                  {input?.urls?.[0] ? (
                    <a
                      href={input.urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-2xl cursor-pointer truncate text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      {formatUrl(input.urls[0])}
                    </a>
                  ) : (
                    t("tools.aWebsite")
                  )}
                </>
              ) : (
                ` ${t("tools.urlCount", { count: urlCount })}`
              )}
            </span>
          </div>
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
            {urlCount === 1 ? (
              <>
                {t("tools.browsing")}{" "}
                {input?.urls?.[0] ? (
                  <a
                    href={input.urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    {formatUrl(input.urls[0])}
                  </a>
                ) : (
                  t("tools.aWebsite")
                )}{" "}
                {t("tools.deniedWord")}
              </>
            ) : (
              t("tools.browsingUrlsDenied", { count: urlCount })
            )}
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Spinner className="text-foreground size-4 shrink-0" />
          </div>
          <span className="text-foreground text-sm font-bold">{t("tools.browsingUrls")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {urlCount === 1 ? (
                <>
                  {t("tools.browsing")}{" "}
                  {input?.urls?.[0] ? (
                    <a
                      href={input.urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      {formatUrl(input.urls[0])}
                    </a>
                  ) : (
                    t("tools.aWebsite")
                  )}{" "}
                  {t("tools.deniedWord")}
                </>
              ) : (
                t("tools.browsingUrlsDenied", { count: urlCount })
              )}
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
          <span className="max-w-2xl truncate">
            {urlCount === 1 ? (
              <>
                {t("tools.browsing")}{" "}
                {input?.urls?.[0] ? (
                  <a
                    href={input.urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    {formatUrl(input.urls[0])}
                  </a>
                ) : (
                  t("tools.aWebsite")
                )}
                ...
              </>
            ) : (
              t("tools.browsingUrlsCount", { count: urlCount })
            )}
          </span>
        </div>
      );
    }

    case "output-available": {
      const results = output?.results || [];
      const isPreliminary = (part as { preliminary?: boolean }).preliminary === true;
      const hasPending = results.some((r) => r.pending);
      const isStreaming = isPreliminary && hasPending;

      if (results.length <= 1) {
        if (isStreaming && results[0]?.pending) {
          return (
            <div key={callId} className="flex items-center gap-1">
              <Spinner className="text-foreground size-4 shrink-0" />
              <span className="text-foreground text-sm font-bold">
                {t("tools.browsing")}{" "}
                {results[0] ? (
                  <a
                    href={results[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-2xl cursor-pointer truncate text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    {formatUrl(results[0].url)}
                  </a>
                ) : (
                  t("tools.aWebsite")
                )}
                ...
              </span>
            </div>
          );
        }
        if (results.length === 1) {
          return <UrlResultDisplay key={callId} result={results[0]} input={input} />;
        }
      }

      const failCount = results.filter((r) => r.error).length;

      return (
        <Accordion
          type="single"
          collapsible
          value={isMainAccordionOpen ? callId : ""}
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/url-content-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  {isStreaming ? (
                    <Spinner
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-0 group-hover/url-content-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                  ) : (
                    <IconWorld
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-0 group-hover/url-content-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                  )}
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-100 group-hover/url-content-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate tabular-nums">
                {isStreaming
                  ? t("tools.browsingUrlsCount", { count: results.length })
                  : t("tools.browsedUrlsCount", { count: results.length })}
                {failCount > 0 && ` ${t("tools.countFailed", { count: failCount })}`}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="flex flex-col gap-1">
                {results.map((result, index) =>
                  result.pending ? (
                    <UrlPendingDisplay key={index} url={result.url} />
                  ) : (
                    <UrlResultDisplay key={index} result={result} input={input} />
                  ),
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        const singleUrl = input?.urls?.[0];

        if (urlCount === 1 && singleUrl) {
          return (
            <div key={callId} className="flex items-center gap-1">
              <IconCircleX className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-sm font-bold">
                {t("tools.browsing")}{" "}
                <a
                  href={singleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer text-blue-500 hover:text-blue-600 hover:underline"
                >
                  {formatUrl(singleUrl)}
                </a>{" "}
                {t("tools.cancelled")}
              </span>
            </div>
          );
        }

        if (urlCount > 1) {
          return (
            <Accordion
              type="single"
              collapsible
              value={isMainAccordionOpen ? callId : ""}
              onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
              className="text-foreground flex flex-row bg-transparent p-0 text-sm"
            >
              <AccordionItem
                value={callId}
                className={cn(
                  "group/url-content-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                  isMainAccordionOpen && "border border-b! p-2",
                )}
              >
                <AccordionTrigger
                  icon={
                    <div className="relative">
                      <IconCircleX
                        className={cn(
                          "text-muted-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-0 group-hover/url-content-accordion:opacity-0",
                          isMainAccordionOpen && "scale-0 opacity-0",
                        )}
                      />
                      <IconChevronDown
                        className={cn(
                          "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-100 group-hover/url-content-accordion:opacity-100",
                          isMainAccordionOpen && "scale-100 opacity-100",
                        )}
                      />
                    </div>
                  }
                  iconPosition="left"
                  shouldRotateIcon={true}
                  className="justify-start gap-1 p-0 font-bold hover:no-underline"
                >
                  <span className="text-muted-foreground max-w-2xl truncate tabular-nums">
                    {t("tools.browsingUrlsCancelled", { count: urlCount })}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-0 pt-2">
                  <div className="flex flex-col gap-1">
                    {input?.urls?.map((url, index) => (
                      <UrlCancelledDisplay key={index} url={url} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.browsingCancelled")}
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
          title={t("tools.getUrlError")}
        />
      );
    }

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconWorld className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            {t("tools.webBrowsingAccessed")}
          </span>
        </div>
      );
  }
};

MessagePartToolGetUrlContent.displayName = "MessagePartToolGetUrlContent";
