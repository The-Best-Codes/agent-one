import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

class StreamRegistry {
  private streams = new Map<string, () => void>();

  register(chatId: string, stopFunction: () => void): void {
    logger.verbose(`Registering stream for chat ${chatId}`);
    this.streams.set(chatId, stopFunction);
  }

  unregister(chatId: string): void {
    logger.verbose(`Unregistering stream for chat ${chatId}`);
    this.streams.delete(chatId);
  }

  stop(chatId: string): boolean {
    const stopFunction = this.streams.get(chatId);
    if (stopFunction) {
      logger.verbose(`Stopping stream for chat ${chatId}`);
      stopFunction();
      this.unregister(chatId);
      return true;
    }
    logger.verbose(`No active stream found for chat ${chatId}`);
    return false;
  }

  isActive(chatId: string): boolean {
    return this.streams.has(chatId);
  }
}

export const streamRegistry = new StreamRegistry();
