import { useEffect } from "react";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export const MessagePartFallback = (props: { type: string }) => {
  const details = JSON.stringify(props);

  useEffect(() => {
    logger.warn(`Unknown or unhandled message part: ${details}`);
  }, [details]);

  return null;
};
