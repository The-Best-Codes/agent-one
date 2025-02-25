"use client";

import { Loader } from "@/components/a1/smooth-loader";
import { Globe } from "lucide-react";
import Link from "next/link";

interface BrowseProps {
  url: string;
  isLoading?: boolean;
}

export const Browse: React.FC<BrowseProps> = ({ url, isLoading }) => {
  return (
    <div className="border rounded-xl p-2 my-4 motion-preset-blur-right">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader className="w-6 h-6 min-w-6 min-h-6" />
        ) : (
          <Globe className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
        )}
        <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
          {isLoading ? "Browsing" : "Browsed"}{" "}
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
