import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "EX";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

interface ExtensionListRowProps {
  title: string;
  description: string;
  version?: string;
  iconUrl?: string;
  websiteUrl?: string;
  badges?: string[];
  installed: boolean;
  installSupported?: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
  advancedContent?: ReactNode;
  moreInfoContent?: ReactNode;
}

export function ExtensionListRow({
  title,
  description,
  version,
  iconUrl,
  websiteUrl,
  badges = [],
  installed,
  installSupported = true,
  onInstall,
  onUninstall,
  advancedContent,
  moreInfoContent,
}: ExtensionListRowProps) {
  const hasAdvanced = Boolean(advancedContent) || Boolean(moreInfoContent);

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border p-4">
      <div className="flex w-full items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="flex min-w-0 items-center gap-2 truncate text-lg font-medium">
              <Avatar className="size-6">
                <AvatarImage src={iconUrl} alt={`${title} icon`} />
                <AvatarFallback className="text-[0.7em]">
                  {getInitials(title)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{title}</span>
            </p>
            {version ? <Badge variant="outline">v{version}</Badge> : null}
          </div>

          <p className="text-muted-foreground line-clamp-2 text-xs">
            {description}
          </p>

          {badges.length > 0 ? (
            <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
              {badges.slice(0, 2).map((tag) => (
                <Badge key={`${title}-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {websiteUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className="size-4" />
                Website
              </a>
            </Button>
          ) : null}

          {installed ? (
            <Button size="sm" variant="destructive" onClick={onUninstall}>
              <Trash2Icon className="size-4" />
              Uninstall
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={onInstall}
              disabled={!installSupported}
            >
              {installSupported ? "Install" : "Unsupported"}
            </Button>
          )}
        </div>
      </div>

      {installed && hasAdvanced ? (
        <Accordion type="single" collapsible>
          <AccordionItem
            value="advanced"
            className="border-border rounded-md border px-3"
          >
            <AccordionTrigger className="py-3">Advanced</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {advancedContent}
                {moreInfoContent ? (
                  <Accordion type="single" collapsible>
                    <AccordionItem
                      value="more-info"
                      className="border-border rounded-md border px-3"
                    >
                      <AccordionTrigger className="py-3">
                        More info
                      </AccordionTrigger>
                      <AccordionContent>{moreInfoContent}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
