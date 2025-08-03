import { getLogger } from "./logger";

const logger = getLogger(import.meta.url);

export const fixUrl = (url: string): string => {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = url.trim();
      url = url.replace(/^[/:]{1,}/, "");
      url = `https://${url}`;
    }
    return url;
  } catch (error) {
    logger.error(`Failed to fix URL: ${url}`, error);
    return url;
  }
};
