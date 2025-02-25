"use client";

import { Loader2, TextIcon } from "lucide-react";

interface OutputSummaryProps {
  isLoading?: boolean;
}

export const OutputSummary: React.FC<OutputSummaryProps> = ({ isLoading }) => {
  return (
    <div className="border rounded-xl p-2 my-4 motion-preset-blur-right">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader2 className="animate-spin w-6 h-6 min-w-6 min-h-6 text-blue-500" />
        ) : (
          <TextIcon className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
        )}
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          {isLoading ? "Generating" : "Generated"} research summary
        </p>
      </div>
    </div>
  );
};
