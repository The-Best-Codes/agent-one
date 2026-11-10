// Don't use this inside menu items (DropdownMenuItem, ContextMenuItem, etc.) via asChild.
// On macOS the menu never receives the click, so nothing happens and the menu stays open.
// Use the item's onSelect with openExternalUrl from "@/lib/open-external-url" instead.
import type { ComponentProps, MouseEvent } from "react";

import { openExternalUrl } from "@/lib/open-external-url";

type ExternalLinkProps = Omit<ComponentProps<"a">, "target"> & {
  openWith?: string;
};

export function ExternalLink({ href, openWith, onClick, rel, ...props }: ExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !href) return;
    event.preventDefault();
    openExternalUrl(href, openWith);
  };

  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel={rel ?? "noopener noreferrer"}
      onClick={handleClick}
    />
  );
}
