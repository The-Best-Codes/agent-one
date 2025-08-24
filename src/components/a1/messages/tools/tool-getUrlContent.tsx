import type { ToolUIPart } from "ai";
import { GlobeIcon, Loader2Icon, XCircleIcon } from "lucide-react";

// TODO: Use an accordion to allow expanding and viewing more tool info
// See tool-webSearch.tsx for reference

interface GetUrlContentInput {
  urls: string[];
  format: string;
  maxLength: number;
  timeoutSeconds?: number;
}

interface UrlResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  format?: string;
  length?: number;
  truncated?: boolean;
  error?: string;
}

interface GetUrlContentOutput {
  success: boolean;
  results?: UrlResult[];
  error?: string;
  urls?: string[];
}

interface GetUrlContentToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolGetUrlContent = ({
  part,
}: GetUrlContentToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as GetUrlContentInput;
  const output = part.output as GetUrlContentOutput;

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      let formattedUrl = urlObj.hostname;
      if (urlObj.pathname !== "/") {
        formattedUrl += urlObj.pathname;
      }
      if (urlObj.search) {
        formattedUrl += urlObj.search;
      }
      if (formattedUrl.length > 500) {
        formattedUrl = formattedUrl.slice(0, 497) + "...";
      }
      return formattedUrl;
    } catch {
      return url;
    }
  };

  // const formatLength = (length: number) => {
  //   if (length < 1000) return `${length} chars`;
  //   if (length < 1000000) return `${(length / 1000).toFixed(1)}K chars`;
  //   return `${(length / 1000000).toFixed(1)}M chars`;
  // };

  const urlCount = input?.urls?.length || 0;

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          </div>
          <span className="text-foreground text-sm font-bold">
            Browsing URLs...
          </span>
        </div>
      );

    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="max-w-2xl truncate">
            {urlCount === 1
              ? `Browsing ${formatUrl(input?.urls?.[0] || "a website")}...`
              : `Browsing ${urlCount === 0 ? " " : `${urlCount} `}URLs...`}
          </span>
        </div>
      );

    case "output-available": {
      if (!output?.success) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-destructive size-4 shrink-0" />
            <span className="text-destructive max-w-2xl truncate text-sm font-bold">
              Failed to browse URLs:{" "}
              <span className="text-destructive/80 font-normal">
                {output?.error || "Unknown error"}
              </span>
            </span>
          </div>
        );
      }

      const results = output?.results || [];
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (results.length === 1) {
        const result = results[0];
        if (!result.success) {
          return (
            <div key={callId} className="flex items-center gap-1">
              <XCircleIcon className="text-destructive size-4 shrink-0" />
              <span className="text-destructive max-w-2xl truncate text-sm font-bold">
                Failed to browse {formatUrl(result.url)}:{" "}
                <span className="text-destructive/80 font-normal">
                  {result.error || "Unknown error"}
                </span>
              </span>
            </div>
          );
        }

        return (
          <p className="text-foreground flex flex-row items-center gap-1 text-sm font-bold">
            <GlobeIcon className="text-foreground size-4 shrink-0" />
            <span className="max-w-2xl truncate">
              Browsed {formatUrl(result.url)}
            </span>
          </p>
        );
      }

      return (
        <div key={callId} className="flex flex-col gap-1">
          <p className="text-foreground flex flex-row items-center gap-1 text-sm font-bold">
            <GlobeIcon className="text-foreground size-4 shrink-0" />
            <span>
              Browsed {results.length === 0 ? " " : `${results.length} `}URLs
              {failCount > 0 && ` (${failCount} failed)`}
            </span>
          </p>
          {results.map((result, index) => (
            <div key={index} className="ml-4 flex items-center gap-1">
              {result.success ? (
                <GlobeIcon className="text-foreground/60 size-3 shrink-0" />
              ) : (
                <XCircleIcon className="text-destructive size-3 shrink-0" />
              )}
              <span
                className={`max-w-2xl truncate text-xs ${
                  result.success ? "text-foreground/80" : "text-destructive"
                }`}
              >
                {formatUrl(result.url)}
                {!result.success && result.error && `: ${result.error}`}
              </span>
            </div>
          ))}
        </div>
      );
    }

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            Error fetching URL content:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <GlobeIcon className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            Unknown getUrlContent tool state
          </span>
        </div>
      );
  }
};

MessagePartToolGetUrlContent.displayName = "MessagePartToolGetUrlContent";
