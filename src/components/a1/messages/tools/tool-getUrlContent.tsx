import type { ToolUIPart } from "ai";
import {
  ChevronDownIcon,
  FileTextIcon,
  GlobeIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { memo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
    if (formattedUrl.length > 50) {
      formattedUrl = formattedUrl.slice(0, 47) + "...";
    }
    return formattedUrl;
  } catch {
    return url;
  }
};

const UrlResultDisplay = memo(
  ({ result, input }: { result: UrlResult; input: GetUrlContentInput }) => {
    if (!result.success) {
      return (
        <div className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive max-w-2xl truncate text-sm font-bold">
            Failed to browse {formatUrl(result.url)}
          </span>
        </div>
      );
    }

    const isRawContent = result.format === "raw" || result.format === "text";

    return (
      <div className="flex items-center gap-1">
        <GlobeIcon className="text-foreground size-4 shrink-0" />
        <span className="text-foreground max-w-2xl truncate text-sm font-bold">
          Browsed {formatUrl(result.url)}
        </span>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            {isRawContent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Fetched raw content</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    result.truncated ? "bg-yellow-500" : "bg-green-500",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {result.truncated
                  ? `Truncated to ${input.maxLength || "unknown"} characters`
                  : `${result.length || "All"} characters processed`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  },
);

UrlResultDisplay.displayName = "UrlResultDisplay";

export const MessagePartToolGetUrlContent = ({
  part,
}: GetUrlContentToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as GetUrlContentInput;
  const output = part.output as GetUrlContentOutput;
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<
    boolean | undefined
  >();

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

      if (results.length === 1) {
        return (
          <UrlResultDisplay key={callId} result={results[0]} input={input} />
        );
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/url-content-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <GlobeIcon
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-0 group-hover/url-content-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <ChevronDownIcon
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/url-content-accordion:scale-100 group-hover/url-content-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">
                Browsed {results.length} URL{results.length !== 1 ? "s" : ""}
                {failCount > 0 && ` (${failCount} failed)`}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="flex flex-col gap-1">
                {results.map((result, index) => (
                  <UrlResultDisplay key={index} result={result} input={input} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error": {
      if (part.errorText === "agent-one::cancelled-by-user") {
        const singleUrl = input?.urls?.[0];

        let message = "Browsing cancelled";
        if (urlCount === 1 && singleUrl) {
          message = `Browsing ${formatUrl(singleUrl)} cancelled`;
        } else if (urlCount > 1) {
          message = `Browsing ${urlCount} URLs cancelled`;
        }

        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              {message}
            </span>
          </div>
        );
      }
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
    }

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
