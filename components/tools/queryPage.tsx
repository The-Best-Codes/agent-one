"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Code } from "lucide-react";
import Link from "next/link";

interface QueryProps {
  url: string;
  selector: string;
  isLoading?: boolean;
  results?: { result: string };
}

export const QueryPage: React.FC<QueryProps> = ({
  url,
  selector,
  isLoading,
  results,
}) => {
  return (
    <div className="border rounded-xl p-0 px-2 my-4 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row space-x-2 w-full">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Finding "
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1">
                {selector}
              </span>
              " elements on{" "}
              <Link
                href={url}
                target="_blank"
                className="text-blue-500 cursor-pointer"
              >
                {url}
              </Link>
            </p>
          </div>
        ) : (
          <Accordion
            className="w-full"
            type="single"
            collapsible
            defaultValue={undefined}
          >
            <AccordionItem className="border-none w-full" value="query-results">
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row max-w-full">
                  <Code className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  <p className="text-base font-medium max-w-96 truncate">
                    Searched for "
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1">
                      {selector}
                    </span>
                    " elements on{" "}
                    <Link
                      href={url}
                      target="_blank"
                      className="text-blue-500 cursor-pointer"
                    >
                      {url}
                    </Link>
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="overflow-auto max-h-64">
                <div className="rounded-xl mt-2 p-0 px-2">
                  {results && results?.result ? (
                    <pre>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {results?.result?.length > 0
                          ? results?.result
                          : "No results found."}
                      </p>
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500">No results found.</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
};
