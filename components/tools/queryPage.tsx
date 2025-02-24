"use client";

import { Loader2, Regex } from "lucide-react";
import Link from "next/link";

interface QueryProps {
  url: string;
  selector: string;
  isLoading?: boolean;
}

export const QueryPage: React.FC<QueryProps> = ({
  url,
  selector,
  isLoading,
}) => {
  return (
    <div className="border rounded p-2 my-4">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader2 className="animate-spin w-6 h-6 min-w-6 min-h-6 text-blue-500" />
        ) : (
          <Regex className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
        )}
        <p className="text-base font-medium">
          {isLoading ? "Finding" : "Searched for"} "
          <span className="font-mono bg-gray-100 px-1">{selector}</span>"{" "}
          elements on{" "}
          <Link
            href={url}
            target="_blank"
            className="text-blue-500 cursor-pointer"
          >
            {url}
          </Link>
        </p>
      </div>
    </div>
  );
};
