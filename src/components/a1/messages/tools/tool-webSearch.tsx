import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

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
  success: boolean;
  query?: string;
  total_results?: number;
  results?: SearchResult[];
  search_url?: string;
  error?: string;
}

export const MessagePartToolWebSearch = ({ part }: WebSearchToolPartProps) => {
  const callId = part.toolCallId;
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<
    boolean | undefined
  >();

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Loader2Icon className="size-4 shrink-0 text-foreground animate-spin" />{" "}
          <span className="text-sm font-bold text-foreground">
            Preparing web search...
          </span>
        </div>
      );

    case "input-available": {
      const input = part.input as WebSearchInput;
      const query = input?.query || "Unknown query";

      return (
        <div key={callId} className="flex flex-row items-center gap-1">
          <Loader2Icon className="size-4 shrink-0 animate-spin text-foreground" />
          <span className="max-w-2xl truncate">
            Searching online for "{query}"...
          </span>
        </div>
      );
    }

    case "output-available": {
      const result = part.output as WebSearchResult;

      if (!result.success) {
        return (
          <div key={callId} className="flex flex-row items-center gap-1">
            <XCircleIcon className="size-4 shrink-0 text-destructive" />{" "}
            <span className="max-w-2xl truncate">
              Web search failed for "{result.query || "unknown query"}"
            </span>
          </div>
        );
      }

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="bg-transparent text-foreground text-sm p-0"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "rounded-md w-fit transition-[background-color,padding] duration-200 group/web-search-accordion",
              isMainAccordionOpen && "bg-muted p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <SearchIcon
                    className={cn(
                      "group-hover/web-search-accordion:hidden inline absolute inset-0 size-4 shrink-0 text-foreground",
                      isMainAccordionOpen && "hidden",
                    )}
                  />
                  <ChevronDownIcon
                    className={cn(
                      "group-hover/web-search-accordion:inline hidden absolute inset-0 size-4 shrink-0 text-foreground",
                      isMainAccordionOpen && "inline",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="p-0 gap-1 justify-start hover:no-underline font-bold"
            >
              <p className="flex flex-row items-center gap-1">
                <span className="max-w-2xl truncate">
                  Found {result.total_results} results for "{result.query}"
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-2 p-0 text-xs text-muted-foreground">
              {/* Removed pr-2 from the element below for now until I find a way to only show pr when it is overflowing */}
              <div className="space-y-2 mt-1 max-h-96 overflow-y-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {result.search_url && (
                    <a
                      href={result.search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      View on DuckDuckGo
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  )}
                </div>
                {result.results?.map((searchResult, index) => (
                  <div key={index} className="border rounded-md p-2">
                    <div className="space-y-1">
                      <a
                        href={searchResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground hover:underline inline-block"
                      >
                        {searchResult.title}
                      </a>
                      <div className="text-xs text-muted-foreground font-mono">
                        {searchResult.display_url}
                      </div>
                      {searchResult.snippet && (
                        <p className="text-xs text-muted-foreground">
                          {searchResult.snippet}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="size-4 shrink-0 text-destructive" />{" "}
          <span className="text-sm font-bold text-destructive">
            Web search error:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />{" "}
          <span className="text-sm font-bold text-muted-foreground">
            Web search
          </span>
        </div>
      );
  }
};

MessagePartToolWebSearch.displayName = "MessagePartToolWebSearch";
