"use client";

import { Globe, Loader2 } from "lucide-react";

interface BrowseProps {
  url: string;
  isLoading?: boolean;
}

export const Browse: React.FC<BrowseProps> = ({ url, isLoading }) => {
  return (
    <div className="border rounded p-2 my-2">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
          </div>
        ) : (
          <Globe className="w-4 h-4 text-gray-500" />
        )}
        <p className="text-sm font-medium">
          {isLoading ? "Browsing" : "Browsed"} {url}
        </p>
      </div>
    </div>
  );
};
