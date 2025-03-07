"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  title: string | null;
  link: string | null;
  description: string | null;
  domain: string | null;
}

interface WebSearchProps {
  args: { query: string };
  isLoading?: boolean;
  results?: { results: SearchResult[] };
}

export const WebSearch: React.FC<WebSearchProps> = ({
  args,
  isLoading,
  results,
}) => {
  return (
    <div className="border rounded-md p-0 px-2 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row w-full space-x-2">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Searching "{args?.query}"
            </p>
          </div>
        ) : (
          <Accordion
            className="w-full"
            type="single"
            collapsible
            defaultValue={undefined}
          >
            <AccordionItem
              className="border-none w-full"
              value="search-results"
            >
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row w-full">
                  <SearchIcon className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  <p className="text-base font-medium max-w-96 truncate">
                    Searched "{args?.query}"
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {results && results.results && results.results.length > 0 ? (
                  <div className="rounded-md mt-2 p-0 px-2">
                    <h3 className="text-lg font-semibold">
                      {results.results.length ?? 0} Results
                    </h3>
                    <ul className="max-h-96 overflow-auto">
                      {results.results.map((result, index) => (
                        <li key={index} className="py-2">
                          <Link
                            href={result.link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 font-medium hover:underline"
                          >
                            {result.title || "No Title"}
                          </Link>
                          {result.description && (
                            <p className="text-sm text-gray-600">
                              {result.description}
                            </p>
                          )}
                          {result.domain && (
                            <p className="text-xs text-gray-500">
                              {result.domain}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-md mt-2 p-0 px-2">
                    <p className="text-sm text-gray-500">
                      No search results found.
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
};
