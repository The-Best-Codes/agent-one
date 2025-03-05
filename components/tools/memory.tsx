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

const operationToString = (
  operation: MemoryProps["args"]["operation"],
  isLoading: boolean | undefined,
) => {
  switch (operation) {
    case "add":
      return isLoading ? "Adding" : "Added";
    case "remove":
      return isLoading ? "Removing" : "Removed";
    case "query":
      return isLoading ? "Querying" : "Queried";
    default:
      return "Memory Operation";
  }
};

const formatMemoryContent = (content: string): React.ReactNode => {
  try {
    const parsedContent = JSON.parse(content);

    if (Array.isArray(parsedContent)) {
      return (
        <ul className="list-disc list-inside">
          {parsedContent.map((item: string, index: number) => {
            try {
              const parsedItem = JSON.parse(item); // Try parsing as JSON first
              if (typeof parsedItem === "object") {
                // Check if it's an object
                return (
                  <li key={index}>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(parsedItem, null, 2)}
                    </pre>
                  </li>
                ); // Pretty print the JSON
              } else {
                return <li key={index}>{item}</li>; // Return as is if not an object
              }
            } catch {
              return <li key={index}>{item}</li>; // If not JSON, return as is
            }
          })}
        </ul>
      );
    } else {
      return <p>{content}</p>; // Return raw content if not an array
    }
  } catch {
    return <p>{content}</p>; // Return raw content if parsing fails
  }
};

export const Memory: React.FC<MemoryProps> = ({ args, isLoading, results }) => {
  const operationString = operationToString(args.operation, isLoading);

  return (
    <div className="border rounded-xl p-0 px-2 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row space-x-2 w-full">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              {operationString} memory "
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
                    {operationString} memory "
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
                    {formatMemoryContent(results?.content)}
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
