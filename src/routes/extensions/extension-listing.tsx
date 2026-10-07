import {
  IconCloud,
  IconDeviceDesktop,
  IconExternalLink,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import { cn } from "@/lib/utils";

import { getExtensionDisplayName, getExtensionPublisher, isVerifiedExtension } from "./curated";
import { type ExtensionStatus } from "./extension-status";

export function ExtensionIcon({
  name,
  iconUrl,
  className,
}: {
  name: string;
  iconUrl?: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarImage src={iconUrl} alt="" />
      <AvatarFallback className="text-base font-semibold">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function VerifiedBadge() {
  return (
    <Badge variant="secondary">
      <IconRosetteDiscountCheckFilled data-icon="inline-start" />
      Verified
    </Badge>
  );
}

export function RunsOnBadge({ transportTypes }: { transportTypes: string[] }) {
  const local = transportTypes.includes("stdio");
  const online = transportTypes.includes("streamable-http");
  if (online) {
    return (
      <Badge variant="outline">
        <IconCloud data-icon="inline-start" />
        {local ? "Online or on device" : "Online"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <IconDeviceDesktop data-icon="inline-start" />
      On your device
    </Badge>
  );
}

interface ExtensionListingProps {
  extension: McpRegistrySummary;
  installed: boolean;
  onInstall: (extension: McpRegistrySummary) => void;
  onManage: (id: string) => void;
}

function ListingButton({ extension, installed, onInstall, onManage }: ExtensionListingProps) {
  if (installed) {
    return (
      <Button size="sm" variant="outline" onClick={() => onManage(extension.id)}>
        Manage
      </Button>
    );
  }
  return (
    <Button size="sm" disabled={!extension.installSupported} onClick={() => onInstall(extension)}>
      {extension.installSupported ? "Install" : "Unsupported"}
    </Button>
  );
}

export function ExtensionCard(props: ExtensionListingProps) {
  const { extension } = props;
  const name = getExtensionDisplayName(extension.id, extension.displayName);

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <ExtensionIcon name={name} iconUrl={extension.iconUrl} className="size-11" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardDescription className="truncate text-xs">
              {getExtensionPublisher(extension.id)}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <ListingButton {...props} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-2">{extension.description}</p>
      </CardContent>
      <CardFooter className="flex-wrap gap-1.5">
        {isVerifiedExtension(extension.id) ? <VerifiedBadge /> : null}
        <RunsOnBadge transportTypes={extension.transportTypes} />
      </CardFooter>
    </Card>
  );
}

export function ExtensionResult(props: ExtensionListingProps) {
  const { extension } = props;
  const name = getExtensionDisplayName(extension.id, extension.displayName);
  const publisher = getExtensionPublisher(extension.id);
  const updated = extension.updatedAt
    ? new Date(extension.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : undefined;
  const topics = (extension.categories.length ? extension.categories : extension.tags).slice(0, 3);

  return (
    <Item variant="outline" className="items-start gap-4 p-4">
      <ItemMedia>
        <ExtensionIcon name={name} iconUrl={extension.iconUrl} className="size-12" />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1.5">
        <ItemTitle className="text-base">{name}</ItemTitle>
        <p className="text-muted-foreground truncate text-xs">
          {[
            publisher && `by ${publisher}`,
            `v${extension.version}`,
            updated && `Updated ${updated}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <ItemDescription className="line-clamp-3">{extension.description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {extension.websiteUrl ? (
          <Button size="icon-sm" variant="ghost" asChild>
            <a href={extension.websiteUrl} target="_blank" rel="noreferrer" aria-label="Website">
              <IconExternalLink />
            </a>
          </Button>
        ) : null}
        <ListingButton {...props} />
      </ItemActions>
      <ItemFooter className="justify-start pl-16">
        <div className="flex flex-wrap gap-1.5">
          {isVerifiedExtension(extension.id) ? <VerifiedBadge /> : null}
          <RunsOnBadge transportTypes={extension.transportTypes} />
          {topics.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>
      </ItemFooter>
    </Item>
  );
}

export function ExtensionStatusBadge({ status }: { status: ExtensionStatus }) {
  return (
    <Badge
      variant={
        status.kind === "error" ? "destructive" : status.kind === "ready" ? "secondary" : "outline"
      }
    >
      {status.kind === "loading" ? <Spinner data-icon="inline-start" /> : null}
      {status.label}
    </Badge>
  );
}
