"use client";

import { Loader2, Search as SearchIcon } from "lucide-react";

interface SearchProps {
  query: string;
  isLoading?: boolean;
}

export const Search: React.FC<SearchProps> = ({ query, isLoading }) => {
  return (
    <div className="border rounded p-2 my-2">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
          </div>
        ) : (
          <SearchIcon className="w-4 h-4 text-gray-500" />
        )}
        <p className="text-sm font-medium">
          {isLoading ? "Searching" : "Searched"} "{query}"
        </p>
      </div>
    </div>
  );
};
