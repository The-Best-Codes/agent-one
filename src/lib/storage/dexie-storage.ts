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
  getItem: <T>(key: string, initialValue: T): Promise<T> => {
    return db.settings
      .get(key)
      .then((item) => (item !== undefined ? (item.value as T) : initialValue))
      .catch((error) => {
        console.error(`Error getting key "${key}" from Dexie:`, error);
        return initialValue;
      });
  },
  setItem: <T>(key: string, value: T): Promise<void> => {
    return db.settings.put({ key, value }).catch((error) => {
      console.error(`Error setting key "${key}" in Dexie:`, error);
    });
  },
  removeItem: (key: string): Promise<void> => {
    return db.settings.delete(key).catch((error) => {
      console.error(`Error removing key "${key}" from Dexie:`, error);
    });
  },
};
