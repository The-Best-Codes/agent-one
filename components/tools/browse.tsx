"use client";

import { Globe, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface BrowseProps {
  url: string;
  isLoading?: boolean;
}

export const Browse: React.FC<BrowseProps> = ({ url, isLoading }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/browse?url=${url}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setContent(data.content);
        setError(null);
      } catch (e: any) {
        setError(e.message);
        setContent(null);
      }
    };

    fetchContent();
  }, [url]);

  return (
    <div className="border rounded p-2 my-2">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-medium">Browsing: {url}</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-red-500 py-4">Error: {error}</div>
      ) : content ? (
        <div className="prose prose-sm max-w-none py-4">{content}</div>
      ) : (
        <div className="text-gray-500 py-4">Fetching content...</div>
      )}
    </div>
  );
};
