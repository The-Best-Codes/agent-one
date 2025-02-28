"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bot as Robot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DeployAgentProps {
  agentName: string;
  task: string;
  isLoading: boolean;
  results?: {
    agentName: string;
    task: string;
    result: string;
  };
}

export function DeployAgent({
  agentName,
  task,
  isLoading,
  results,
}: DeployAgentProps) {
  return (
    <div className="border rounded-xl p-0 px-2 my-4 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row w-full space-x-2">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Agent "{agentName}" is working. This may take a few minutes.
            </p>
          </div>
        ) : (
          <Accordion
            className="w-full"
            type="single"
            collapsible
            defaultValue={undefined}
          >
            <AccordionItem className="border-none w-full" value="agent-results">
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row w-full">
                  <Robot className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  <p className="text-base font-medium max-w-96 truncate">
                    {results
                      ? `Agent "${results.agentName || agentName}" finished`
                      : `Agent Deployed: ${agentName}`}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {results ? (
                  <div className="rounded-xl mt-2 p-0">
                    <div className="text-sm text-muted-foreground mb-2">
                      Task: {results.task || task}
                    </div>
                    <div className="border-t pt-2 mt-2 overflow-auto max-h-96 prose-sm dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {results.result
                          ? typeof results.result === "string"
                            ? results.result
                            : JSON.stringify(results.result)
                          : "Agent didn't respond"}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl mt-2 p-0 px-2">
                    <p className="text-sm text-gray-500 mb-2">Task: {task}</p>
                    <p className="text-sm text-gray-500">
                      No results available.
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
}
