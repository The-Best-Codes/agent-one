import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import type { ToolUIPart } from "ai";

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

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-2">
          <SearchIcon className="size-4 shrink-0 text-blue-500 animate-pulse" />
          <span className="text-sm font-bold text-blue-600">
            Preparing web search...
          </span>
        </div>
      );

    case "input-available": {
      const input = part.input as WebSearchInput;
      const query = input?.query || "Unknown query";
      const maxResults = input?.maxResults || 10;

      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-blue-50 dark:bg-blue-950/20 my-1"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-blue-600 flex flex-row items-center gap-1">
                <SearchIcon className="size-4 shrink-0 animate-pulse" />
                <span className="max-w-2xl truncate">
                  Searching web for "{query}"...
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              <div className="text-xs text-foreground/80">
                <span className="font-medium">Search parameters:</span>
                <div className="mt-1 space-y-1">
                  <div>
                    Query: <span className="font-mono">{query}</span>
                  </div>
                  <div>
                    Max results: <span className="font-mono">{maxResults}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-available": {
      const result = part.output as WebSearchResult;

      if (!result.success) {
        return (
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-md bg-red-50 dark:bg-red-950/20 my-1"
          >
            <AccordionItem value={callId}>
              <AccordionTrigger className="p-2 hover:no-underline">
                <p className="text-sm font-bold text-red-600 flex flex-row items-center gap-1">
                  <SearchIcon className="size-4 shrink-0" />
                  <span className="max-w-2xl truncate">
                    Web search failed for "{result.query || "unknown query"}"
                  </span>
                </p>
              </AccordionTrigger>
              <AccordionContent className="pt-0 p-2">
                <div className="text-sm text-red-600">
                  <div className="font-medium">Error:</div>
                  <div className="mt-1">
                    {result.error || "Unknown error occurred"}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-green-50 dark:bg-green-950/20 my-1"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-green-600 flex flex-row items-center gap-1">
                <SearchIcon className="size-4 shrink-0" />
                <span className="max-w-2xl truncate">
                  Found {result.total_results} results for "{result.query}"
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Badge variant="secondary" className="text-xs">
                    {result.total_results} results
                  </Badge>
                  {result.search_url && (
                    <a
                      href={result.search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      View on DuckDuckGo
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.results?.map((searchResult, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-3 bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <a
                          href={searchResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2"
                        >
                          {searchResult.title}
                        </a>
                        <div className="text-xs text-green-600 font-mono">
                          {searchResult.display_url}
                        </div>
                        {searchResult.snippet && (
                          <p className="text-xs text-foreground/80 line-clamp-3">
                            {searchResult.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-2">
          <SearchIcon className="size-4 shrink-0 text-red-500" />
          <span className="text-sm font-bold text-red-600">
            Web search error:{" "}
            <span className="text-red-500/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-2">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground">
            Web search
          </span>
        </div>
      );
  }
};

MessagePartToolWebSearch.displayName = "MessagePartToolWebSearch";
