import type { ToolUIPart } from "ai";
import { GlobeIcon, Loader2Icon, XCircleIcon } from "lucide-react";

// TODO: Use an accordion to allow expanding and viewing more tool info

interface GetUrlContentInput {
  url: string;
  format: string;
  maxLength: number;
  timeoutSeconds?: number;
}

interface GetUrlContentOutput {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  format?: string;
  length?: number;
  truncated?: boolean;
  error?: string;
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

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Loader2Icon className="h-4 w-4 animate-spin shrink-0 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Browsing URL...
          </span>
        </div>
      );

    case "input-available":
      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <Loader2Icon className="h-4 w-4 animate-spin shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">
            Browsing {formatUrl(input?.url || "")}...
          </span>
        </p>
      );

    case "output-available":
      if (!output?.success) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
            <span className="text-sm font-bold text-destructive max-w-2xl truncate">
              Failed to browse {formatUrl(input?.url || "")}:{" "}
              <span className="font-normal text-destructive/80">
                {output?.error || "Unknown error"}
              </span>
            </span>
          </div>
        );
      }

      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <GlobeIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">
            Browsed {formatUrl(output.url)}
            {/* TODO: Move other info (raw or markdown, the stuff below) inside accordion */}
            {/* {output.title && ` - "${output.title}"`}
            {output.length && ` (${formatLength(output.length)})`}
            {output.truncated && " - truncated"} */}
          </span>
        </p>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Error fetching URL content:{" "}
            <span className="font-normal text-destructive/80">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <GlobeIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown getUrlContent tool state
          </span>
        </div>
      );
  }
};
