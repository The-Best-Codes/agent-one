"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";

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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div className="border rounded-xl p-2 my-4 motion-preset-blur-right">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader className="w-6 h-6 min-w-6 min-h-6" />
        ) : (
          <SearchIcon className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
        )}
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          {isLoading ? "Searching" : "Searched"} "{query}"
        </p>
      </div>

      {results &&
      results.results &&
      results.results.length > 0 &&
      !isLoading ? (
        <Accordion type="single" collapsible defaultValue={undefined}>
          <AccordionItem value="search-results">
            <AccordionTrigger className="text-base">
              Search Results
            </AccordionTrigger>
            <AccordionContent>
              <ul>
                {results.results.map((result, index) => (
                  <li key={index} className="py-2">
                    <a
                      href={result.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {result.title || "No Title"}
                    </a>
                    {result.description && (
                      <p className="text-sm text-gray-600">
                        {result.description}
                      </p>
                    )}
                    {result.domain && (
                      <p className="text-xs text-gray-500">
                        Domain: {result.domain}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : results &&
        results.results &&
        results.results.length === 0 &&
        !isLoading ? (
        <p className="text-sm text-gray-500 mt-2">No search results found.</p>
      ) : null}
    </div>
  );
};
