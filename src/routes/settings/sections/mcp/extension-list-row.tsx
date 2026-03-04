import {
  ChevronRightIcon,
  ExternalLinkIcon,
  PackageIcon,
  Trash2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  moreInfoJson?: unknown;
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
  moreInfoJson,
}: ExtensionListRowProps) {
  const hasAdvanced = Boolean(advancedContent) || moreInfoJson !== undefined;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="bg-muted/40 flex w-full flex-col gap-3 rounded-md p-4 not-dark:border">
      <div className="flex w-full items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="flex min-w-0 items-center gap-2 truncate text-lg font-medium">
              <Avatar className="size-6">
                <AvatarImage src={iconUrl} alt={`${title} icon`} />
                <AvatarFallback>
                  <PackageIcon />
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
        <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between rounded-md border px-3 py-2 text-sm font-medium"
            >
              Advanced
              <ChevronRightIcon className="text-muted-foreground size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{title} advanced config</DialogTitle>
              <DialogDescription>
                Edit advanced settings for this extension.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-1">
              {advancedContent}
              {moreInfoJson !== undefined ? (
                <Accordion
                  type="single"
                  collapsible
                  className="rounded-md border px-3"
                >
                  <AccordionItem value="more-info" className="border-b-0">
                    <AccordionTrigger className="py-3">
                      Debug info
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                        {JSON.stringify(moreInfoJson, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
