import type { Table } from "dexie";
import Dexie from "dexie";

interface SettingItem {
  key: string;
  value: unknown;
}

class AgentOneDB extends Dexie {
  settings!: Table<SettingItem>;

  constructor() {
    super("AgentOneDB");
    this.version(1).stores({
      settings: "key",
    });
  }
}

const db = new AgentOneDB();

export const dexieStorage = {
  getItem: async <T>(key: string, initialValue: T): Promise<T> => {
    try {
      const item = await db.settings.get(key);
      return item !== undefined ? (item.value as T) : initialValue;
    } catch (error) {
      console.error(`Error getting key "${key}" from Dexie:`, error);
      return initialValue;
    }
  },
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      await db.settings.put({ key, value });
    } catch (error) {
      console.error(`Error setting key "${key}" in Dexie:`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await db.settings.delete(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from Dexie:`, error);
    }
  },
};
