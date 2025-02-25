"use client";

import { Loader } from "@/components/a1/smooth-loader";
import { Search as SearchIcon } from "lucide-react";

interface SearchProps {
  query: string;
  isLoading?: boolean;
}

export const Search: React.FC<SearchProps> = ({ query, isLoading }) => {
  return (
    <div className="border rounded-xl p-2 my-4 motion-preset-blur-right">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader className="w-6 h-6 min-w-6 min-h-6" />
        ) : (
          <SearchIcon className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
        )}
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          {isLoading ? "Searching" : "Searched"} "{query}"
        </p>
      </div>
    </div>
  );
};
