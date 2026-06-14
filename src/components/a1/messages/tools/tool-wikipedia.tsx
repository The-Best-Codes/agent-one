import {
  IconBrandWikipedia,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconLink,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type WikipediaAction = "search" | "getSummary" | "getContent" | "getLinks" | "getCategories";

interface WikipediaInput {
  action: WikipediaAction;
  query?: string;
  title?: string;
  maxResults?: number;
}

interface WikipediaToolPartProps {
  part: ToolUIPart;
}

interface WikipediaSearchOutput {
  action: "search";
  query?: string;
  results?: Array<{ title: string; snippet: string; pageid: number }>;
  suggestion?: string;
  error?: string;
}

interface WikipediaArticleOutput {
  action: "getSummary" | "getContent" | "getLinks" | "getCategories";
  title?: string;
  summary?: string;
  content?: string;
  url?: string;
  description?: string;
  links?: string[];
  categories?: string[];
  error?: string;
}

type WikipediaOutput = WikipediaSearchOutput | WikipediaArticleOutput;

const ACTION_LABELS: Record<WikipediaAction, (input: WikipediaInput) => string> = {
  search: (i) => `Search Wikipedia for "${i.query}"`,
  getSummary: (i) => `Read "${i.title}" on Wikipedia`,
  getContent: (i) => `Read full content of "${i.title}" on Wikipedia`,
  getLinks: (i) => `View links from "${i.title}" on Wikipedia`,
  getCategories: (i) => `View categories of "${i.title}" on Wikipedia`,
};

function getToolLabel(input: WikipediaInput | undefined): string {
  if (!input) return "Wikipedia";
  return ACTION_LABELS[input.action]?.(input) ?? "Wikipedia";
}

export const MessagePartToolWikipedia = ({ part }: WikipediaToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as WikipediaInput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const label = getToolLabel(input);

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconBrandWikipedia className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">AgentOne wants to {label}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              Deny
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              Approve
            </Button>
          </div>
        </div>
      );

    case "output-denied":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">{label} denied</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />{" "}
          <span className="text-foreground text-sm font-bold">Preparing Wikipedia request...</span>
        </div>
      );

    case "approval-responded":
    case "input-available":
      return (
        <div key={callId} className="flex flex-row items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate text-sm font-bold">{label}...</span>
        </div>
      );

    case "output-available": {
      const result = part.output as WikipediaOutput;

      if (result.error) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-destructive size-4 shrink-0" />
            <span className="text-destructive text-sm font-bold">{result.error}</span>
          </div>
        );
      }

      if (result.action === "search") {
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
                "group/wikipedia-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isMainAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconBrandWikipedia
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-0 group-hover/wikipedia-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-100 group-hover/wikipedia-accordion:opacity-100",
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
                  Found {result.results?.length ?? 0} Wikipedia results for "{result.query}"
                  {result.suggestion ? ` (suggested: "${result.suggestion}")` : ""}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
                <ScrollArea type="always" viewportClassName="max-h-96">
                  <div className="flex flex-col gap-2">
                    {result.results?.map((r) => (
                      <div key={r.pageid} className="rounded-md border p-2">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground inline-block text-sm font-medium hover:underline"
                          >
                            {r.title}
                          </a>
                          <p
                            className="text-muted-foreground text-xs"
                            dangerouslySetInnerHTML={{ __html: r.snippet }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      if (result.action === "getSummary") {
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
                "group/wikipedia-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isMainAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconBrandWikipedia
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-0 group-hover/wikipedia-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-100 group-hover/wikipedia-accordion:opacity-100",
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
                  Read summary of "{result.title}" on Wikipedia
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
                <ScrollArea type="always" viewportClassName="max-h-96">
                  <div className="flex flex-col gap-2">
                    {result.description && (
                      <p className="text-muted-foreground text-xs italic">{result.description}</p>
                    )}
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        View on Wikipedia
                        <IconExternalLink className="ml-1 inline size-3" />
                      </a>
                    )}
                    {result.summary && (
                      <div className="rounded-md border p-2">
                        <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                          {result.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      if (result.action === "getContent") {
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
                "group/wikipedia-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isMainAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconBrandWikipedia
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-0 group-hover/wikipedia-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-100 group-hover/wikipedia-accordion:opacity-100",
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
                  Read full content of "{result.title}" on Wikipedia
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
                <ScrollArea type="always" viewportClassName="max-h-96">
                  <div className="rounded-md border p-2">
                    <pre className="text-muted-foreground text-xs whitespace-pre-wrap">
                      {result.content}
                    </pre>
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      if (result.action === "getLinks") {
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
                "group/wikipedia-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isMainAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconBrandWikipedia
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-0 group-hover/wikipedia-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-100 group-hover/wikipedia-accordion:opacity-100",
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
                  Found {result.links?.length ?? 0} links from "{result.title}" on Wikipedia
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
                <ScrollArea type="always" viewportClassName="max-h-96">
                  <div className="flex flex-wrap gap-1">
                    {result.links?.map((link) => (
                      <a
                        key={link}
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(link.replace(/ /g, "_"))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:underline"
                      >
                        <IconLink className="size-3 shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      if (result.action === "getCategories") {
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
                "group/wikipedia-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isMainAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconBrandWikipedia
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-0 group-hover/wikipedia-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-accordion:scale-100 group-hover/wikipedia-accordion:opacity-100",
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
                  Found {result.categories?.length ?? 0} categories for "{result.title}" on
                  Wikipedia
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
                <ScrollArea type="always" viewportClassName="max-h-96">
                  <div className="flex flex-wrap gap-1">
                    {result.categories?.map((cat) => (
                      <span
                        key={cat}
                        className="text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
                      >
                        <IconTag className="size-3 shrink-0" />
                        {cat}
                      </span>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      return null;
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />{" "}
            <span className="text-muted-foreground text-sm font-bold">
              Wikipedia request cancelled
            </span>
          </div>
        );
      }
      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsErrorAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/wikipedia-error border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wikipedia-error:scale-0 group-hover/wikipedia-error:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wikipedia-error:scale-100 group-hover/wikipedia-error:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Wikipedia error</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-destructive/80 text-sm font-normal">
                {part?.errorText || "Unknown error"}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBrandWikipedia className="text-muted-foreground size-4 shrink-0" />{" "}
          <span className="text-muted-foreground text-sm font-bold">Wikipedia accessed</span>
        </div>
      );
  }
};

MessagePartToolWikipedia.displayName = "MessagePartToolWikipedia";
