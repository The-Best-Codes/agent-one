"use client";
import { Loader } from "@/components/a1/smooth-loader";
import { Code, Terminal } from "lucide-react";
import React from "react";

interface RunJsProps {
  args: { code: string };
  isLoading?: boolean;
  results?: { status: string; result?: string; error?: string };
}

export const RunJs: React.FC<RunJsProps> = ({ args, isLoading, results }) => {
  return (
    <div className="border rounded-md p-2 my-2">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {isLoading ? (
          <Loader className="w-5 h-5" />
        ) : results?.status === "Execution failed" ? (
          <Terminal className="w-5 h-5 text-destructive" />
        ) : (
          <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        )}
        <span>
          {isLoading ? "Executing JavaScript" : "JavaScript Execution Result"}
        </span>
      </div>
      <div className="mt-2 text-xs">
        <p className="font-medium">Code:</p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-auto max-h-32">
          {args.code}
        </pre>
        {!isLoading && results && (
          <>
            <p className="font-medium mt-2">Status:</p>
            <p
              className={`p-2 rounded-md ${
                results.status === "Execution failed"
                  ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              }`}
            >
              {results.status}
            </p>
            {results.result && (
              <>
                <p className="font-medium mt-2">Result:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-auto max-h-32">
                  {results.result}
                </pre>
              </>
            )}
            {results.error && (
              <>
                <p className="font-medium mt-2">Error:</p>
                <pre className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-2 rounded-md overflow-auto max-h-32">
                  {results.error}
                </pre>
              </>
            )}
          </>
        )}
        {!isLoading && !results && (
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Waiting for execution results...
          </p>
        )}
      </div>
    </div>
  );
};
