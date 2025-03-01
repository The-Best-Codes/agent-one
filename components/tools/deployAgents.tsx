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

interface AgentResult {
  agentName: string;
  task: string;
  result: string;
}

interface DeployAgentsProps {
  isLoading: boolean;
  results?: {
    agents: AgentResult[];
  };
  agents?: {
    agentName: string;
    task: string;
  }[];
}

export function DeployAgent({ isLoading, results, agents }: DeployAgentsProps) {
  return (
    <div className="border rounded-xl p-0 px-2 my-4 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row w-full space-x-2">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Deploying agents... This may take a few minutes.
            </p>
          </div>
        ) : (
          <Accordion className="w-full" type="multiple">
            {results?.agents?.map((agentResult, index) => (
              <AccordionItem
                key={index}
                className="border-none w-full"
                value={`agent-${index}`}
              >
                <AccordionTrigger className="text-base w-full py-2 font-medium">
                  <div className="flex flex-row w-full">
                    <Robot className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                    <p className="text-base font-medium max-w-96 truncate">
                      {`Agent "${agentResult.agentName}" finished`}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-xl mt-2 p-0">
                    <div className="text-sm text-muted-foreground mb-2">
                      Task: {agentResult.task}
                    </div>
                    <div className="border-t pt-2 mt-2 overflow-auto max-h-96 prose-sm dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {agentResult.result
                          ? typeof agentResult.result === "string"
                            ? agentResult.result
                            : JSON.stringify(agentResult.result)
                          : "Agent didn't respond"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {!results && agents && agents.length > 0 && (
              <AccordionItem
                key="no-results"
                className="border-none w-full"
                value="no-results"
              >
                <AccordionTrigger className="text-base w-full py-2 font-medium">
                  <div className="flex flex-row w-full">
                    <Robot className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                    <p className="text-base font-medium max-w-96 truncate">
                      {`Agents Deployed`}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-xl mt-2 p-0 px-2">
                    {agents.map((agent, index) => (
                      <div key={index}>
                        <p className="text-sm text-gray-500 mb-2">
                          Agent {index + 1} Task: {agent.task}
                        </p>
                      </div>
                    ))}
                    <p className="text-sm text-gray-500">
                      No results available.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}
