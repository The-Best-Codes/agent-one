import { getLogger } from "./logger";

const logger = getLogger(import.meta.url);

export const fixUrl = async (url: string): Promise<string> => {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = url.trim();
      url = url.replace(/^[/:]{1,}/, "");
      url = `https://${url}`;
    }
    return url;
  } catch (error) {
    // Log any errors that occur during the URL fixing process.
    logger.error(`Failed to fix URL: ${url}`, error);
    // In case of an error, return the original URL to prevent further issues,
    // as per the existing error handling logic.
    return url;
  }
};
