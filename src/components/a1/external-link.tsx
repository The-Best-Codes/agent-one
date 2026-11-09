import { openUrl } from "@tauri-apps/plugin-opener";
import type { ComponentProps, MouseEvent } from "react";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type ExternalLinkProps = Omit<ComponentProps<"a">, "target"> & {
  openWith?: string;
};

export function ExternalLink({ href, openWith, onClick, rel, ...props }: ExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !href) return;
    event.preventDefault();
    void openUrl(href, openWith).catch((error: unknown) => {
      logger.error("Failed to open external link", error);
    });
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
