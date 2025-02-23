"use client";

import { Loader2, Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchProps {
  query: string;
  isLoading?: boolean;
}

export const Search: React.FC<SearchProps> = ({ query, isLoading }) => {
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/search?query=${query}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setResults(data.results);
        setError(null);
      } catch (e: any) {
        setError(e.message);
        setResults([]);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="border rounded p-2 my-2">
      <div className="flex items-center space-x-2">
        <SearchIcon className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-medium">Searching: {query}</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-red-500 py-4">Error: {error}</div>
      ) : (
        <ul className="list-disc list-inside py-4">
          {results.map((result, index) => (
            <li key={index} className="text-sm">
              {result}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
