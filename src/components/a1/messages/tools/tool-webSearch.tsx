import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface WebSearchInput {
  query: string;
  maxResults?: number;
}

interface WebSearchToolPartProps {
  part: ToolUIPart;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  display_url: string;
}

interface WebSearchResult {
  query?: string;
  total_results?: number;
  results?: SearchResult[];
  search_url?: string;
  error?: string;
}

export const MessagePartToolWebSearch = ({ part }: WebSearchToolPartProps) => {
  const { t } = useTranslation();
  const callId = part.toolCallId;
  const input = part.input as WebSearchInput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const query = input?.query || t("tools.unknownQuery");

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconSearch className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {t("tools.wantsToSearch", { query })}
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
            {t("tools.webSearchDenied", { query })}
          </span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />{" "}
          <span className="text-foreground text-sm font-bold">{t("tools.preparingWebSearch")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {t("tools.webSearchDenied", { query })}
            </span>
          </div>
        );
      }
      return (
        <div key={callId} className="flex flex-row items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate text-sm font-bold">
            {t("tools.searchingOnline", { query })}
          </span>
        </div>
      );
    }

    case "output-available": {
      const result = part.output as WebSearchResult;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/web-search-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconSearch
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/web-search-accordion:scale-0 group-hover/web-search-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/web-search-accordion:scale-100 group-hover/web-search-accordion:opacity-100",
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
                {t("tools.foundResults", { total: result.total_results, query: result.query })}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
              <ScrollArea type="always" viewportClassName="max-h-96">
                <div className="flex flex-col gap-2">
                  <div>
                    {result.search_url && (
                      <a
                        href={result.search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        {t("tools.viewOnDuckDuckGo", { query: result.query })}
                        <IconExternalLink className="ml-1 inline size-3" />
                      </a>
                    )}
                  </div>
                  {result.results?.map((searchResult, index) => (
                    <div key={index} className="rounded-md border p-2">
                      <div className="flex flex-col gap-1">
                        <a
                          href={searchResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground inline-block text-sm font-medium hover:underline"
                        >
                          {searchResult.title}
                        </a>
                        <div className="text-muted-foreground font-mono text-xs">
                          {searchResult.display_url}
                        </div>
                        {searchResult.snippet && (
                          <p className="text-muted-foreground text-xs">{searchResult.snippet}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        const input = part.input as WebSearchInput;
        const query = input?.query;
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />{" "}
            <span className="text-muted-foreground text-sm font-bold">
              {query
                ? t("tools.webSearchCancelled", { query })
                : t("tools.webSearchCancelledShort")}
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
          title={t("tools.webSearchError")}
        />
      );
    }

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconSearch className="text-muted-foreground size-4 shrink-0" />{" "}
          <span className="text-muted-foreground text-sm font-bold">
            {t("tools.webSearchAccessed")}
          </span>
        </div>
      );
  }
};

MessagePartToolWebSearch.displayName = "MessagePartToolWebSearch";
