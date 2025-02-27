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

interface SearchProps {
  query: string;
  isLoading?: boolean;
  results?: { results: SearchResult[] };
}

export const Search: React.FC<SearchProps> = ({
  query,
  isLoading,
  results,
}) => {
  return (
    <div className="border rounded-xl p-0 px-2 my-4 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading
          ? (
            <div className="py-2 flex flex-row w-full space-x-2">
              <Loader className="w-6 h-6 min-w-6 min-h-6" />
              <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
                Searching "{query}"
              </p>
            </div>
          )
          : results && results.results && results.results.length > 0
          ? (
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
                      Searched "{query}"
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-xl mt-2 p-0 px-2">
                    <h3 className="text-lg font-semibold">
                      {results.results.length ?? 0} Results
                    </h3>
                    <ul>
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
          : (
            <>
              <SearchIcon className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
              <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
                Searched "{query}"
              </p>
              <p className="text-sm text-gray-500 mt-2">
                No search results found.
              </p>
            </>
          )}
      </div>
    </div>
  );
};
