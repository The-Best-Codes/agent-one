import { Browse } from "@/components/tools/browse";
import { DeployAgent } from "@/components/tools/deployAgents";
import { FinishResearch } from "@/components/tools/finishResearch";
import { ImageDesc } from "@/components/tools/imageDesc";
import { Memory } from "@/components/tools/memory";
import { QueryPage } from "@/components/tools/queryPage";
import { Search } from "@/components/tools/search";
import type { ToolInvocation } from "ai";
import { CircleHelp } from "lucide-react";

// Define a mapping of tool names to components
const TOOL_COMPONENTS = {
  searchTool: Search,
  browseTool: Browse,
  queryPageTool: QueryPage,
  imageDescTool: ImageDesc,
  deployAgentsTool: DeployAgent,
  memoryTool: Memory,
  finishResearchTool: FinishResearch,
};

interface ToolRendererProps {
  toolInvocation: ToolInvocation;
  messageId: string;
  partIndex: number;
  isLoading: boolean;
}

export const ToolRenderer = ({
  toolInvocation,
  messageId,
  partIndex,
  isLoading,
}: ToolRendererProps) => {
  // Extract tool information
  const { toolName, args, state } = toolInvocation;

  // Check if we have a component for this tool
  if (toolName in TOOL_COMPONENTS) {
    // Get the appropriate component
    const ToolComponent =
      TOOL_COMPONENTS[toolName as keyof typeof TOOL_COMPONENTS];

    return (
      <ToolComponent
        key={`${messageId}-${toolName}-${partIndex}`}
        args={args}
        isLoading={isLoading}
        results={state === "result" ? toolInvocation.result : undefined}
      />
    );
  }

  // Fallback for unknown tools
  return (
    <div
      key={`${messageId}-unknown-tool-${partIndex}`}
      className="border rounded-xl p-2 my-4 motion-preset-blur-right"
    >
      <div className="flex items-center space-x-2">
        <CircleHelp className="w-6 h-6 min-w-6 min-h-6" />
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          Oops! AgentOne tried to use an unsupported tool: {toolName}
        </p>
      </div>
    </div>
  );
};
