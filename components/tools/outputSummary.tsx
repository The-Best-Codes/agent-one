"use client";

import { Loader2, TextIcon } from "lucide-react";

interface OutputSummaryProps {
  isLoading?: boolean;
  onClick?: () => void;
}

export const OutputSummary: React.FC<OutputSummaryProps> = ({
  isLoading,
  onClick,
}) => {
  return (
    <button
      className="border cursor-pointer rounded-xl p-2 my-4 motion-preset-blur-right w-full"
      onClick={onClick}
      disabled={isLoading}
    >
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
    </button>
  );
};
