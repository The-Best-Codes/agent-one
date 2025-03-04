"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Brain } from "lucide-react";

interface MemoryProps {
  args: {
    operation: "add" | "remove" | "query" | null;
    text: {
      add?: string;
      remove?: string;
      query?: string;
    } | null;
  };
  isLoading?: boolean;
  results?: { content: string };
}

const operationToString = (operation: MemoryProps["args"]["operation"]) => {
  switch (operation) {
    case "add":
      return "Adding";
    case "remove":
      return "Removing";
    case "query":
      return "Querying";
    default:
      return "Memory Operation";
  }
};

export const Memory: React.FC<MemoryProps> = ({ args, isLoading, results }) => {
  const operationString = operationToString(args.operation);

  return (
    <div className="border rounded-xl p-0 px-2 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row space-x-2 w-full">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              {operationString} memory: "
              {(args.text && args.operation && args.text[args.operation]) ||
                "No data"}
              "
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
              value="memory-content"
            >
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row w-full">
                  <Brain className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  <p className="text-base font-medium max-w-96 truncate">
                    {operationString} memory: "
                    {(args.text &&
                      args.operation &&
                      args.text[args.operation]) ||
                      "No data"}
                    "
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
