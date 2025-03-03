"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Globe } from "lucide-react";
import Link from "next/link";

interface ReadSiteProps {
  args: { url: string };
  isLoading?: boolean;
  results?: { content: string };
}

export const ReadSite: React.FC<ReadSiteProps> = ({
  args,
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
              Reading{" "}
              <Link
                href={args.url}
                target="_blank"
                className="text-blue-500 cursor-pointer"
              >
                {args.url}
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
            <AccordionItem
              className="border-none w-full"
              value="browse-content"
            >
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row w-full">
                  <Globe className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  <p className="text-base font-medium max-w-96 truncate">
                    Read{" "}
                    <Link
                      href={args.url}
                      target="_blank"
                      className="text-blue-500 cursor-pointer"
                    >
                      {args.url}
                    </Link>
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="overflow-auto max-h-64">
                {results ? (
                  <div className="rounded-xl mt-2 p-0 px-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {results?.content}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl mt-2 p-0 px-2">
                    <p className="text-sm text-gray-500">No content found.</p>
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
