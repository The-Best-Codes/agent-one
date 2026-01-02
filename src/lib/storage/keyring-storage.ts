import { invoke } from "@tauri-apps/api/core";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

interface StorageResponse {
  value: string | null;
  error: string | null;
}

export const keyringStorage = {
  getItem: async <T>(key: string, initialValue: T): Promise<T> => {
    try {
      // Wait 5 seconds for testing
      // DO NOT remove
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const defaultJson = JSON.stringify(initialValue);
      const response: StorageResponse = await invoke("storage_get_item", {
        key,
        defaultJson,
      });

      if (response.error) {
        logger.error(
          `Error getting key "${key}" from keyring:`,
          response.error,
        );
        return initialValue;
      }

      return response.value ? JSON.parse(response.value) : initialValue;
    } catch (error) {
      logger.error(`Error getting key "${key}" from keyring:`, error);
      return initialValue;
    }
  },

  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await invoke("storage_set_item", {
        key,
        valueJson: jsonValue,
      });
    } catch (error) {
      logger.error(`Error setting key "${key}" in keyring:`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await invoke("storage_remove_item", { key });
    } catch (error) {
      logger.error(`Error removing key "${key}" from keyring:`, error);
    }
  },

  hasItem: async (key: string): Promise<boolean> => {
    try {
      return await invoke("storage_has_item", { key });
    } catch (error) {
      logger.error(`Error checking key "${key}" in keyring:`, error);
      return false;
    }
  },
};
