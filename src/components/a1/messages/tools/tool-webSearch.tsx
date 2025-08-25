import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />{" "}
          <span className="text-foreground text-sm font-bold">
            Preparing web search...
          </span>
        </div>
      );

    case "input-available": {
      const input = part.input as WebSearchInput;
      const query = input?.query || "Unknown query";

      return (
        <div key={callId} className="flex flex-row items-center gap-1">
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
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
          <div
            key={callId}
            className="flex flex-row items-center gap-1 text-sm"
          >
            <XCircleIcon className="text-destructive size-4 shrink-0" />{" "}
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
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/web-search-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border-1 !border-b-1 p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <SearchIcon
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/web-search-accordion:scale-0 group-hover/web-search-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <ChevronDownIcon
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
                Found {result.total_results} results for "{result.query}"
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
              <ScrollArea type="always" viewportClassName="max-h-96">
                <div className="space-y-2">
                  <div>
                    {result.search_url && (
                      <a
                        href={result.search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        View <span className="italic">"{result.query}"</span> on
                        DuckDuckGo
                        <ExternalLinkIcon className="ml-1 inline size-3" />
                      </a>
                    )}
                  </div>
                  {result.results?.map((searchResult, index) => (
                    <div key={index} className="rounded-md border p-2">
                      <div className="space-y-1">
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
                          <p className="text-muted-foreground text-xs">
                            {searchResult.snippet}
                          </p>
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

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />{" "}
          <span className="text-destructive text-sm font-bold">
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
          <SearchIcon className="text-muted-foreground size-4 shrink-0" />{" "}
          <span className="text-muted-foreground text-sm font-bold">
            Unknown web search tool state
          </span>
        </div>
      );
  }
};

MessagePartToolWebSearch.displayName = "MessagePartToolWebSearch";
