"use client";
import { Text } from "lucide-react";

// Props to prevent errors in dynamic tool rendering, not actually used
interface FinishResearchProps {
  args: null | undefined;
  isLoading: boolean | null | undefined;
  results: null | undefined;
}

export const FinishResearch = ({
  args,
  isLoading,
  results,
}: FinishResearchProps) => {
  return (
    <div className="border rounded-xl p-0 px-2 motion-preset-blur-right">
      <div className="py-2 flex flex-row space-x-2 w-full">
        <Text className="w-6 h-6 min-w-6 min-h-6" />
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          AgentOne finished researching the topic.
        </p>
      </div>
    </div>
  );
};
