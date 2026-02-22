import Dexie from "dexie";

const SIMULATED_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface KVEntry {
  key: string;
  value: string;
}

class AsyncStorageDB extends Dexie {
  kv!: Dexie.Table<KVEntry, string>;

  constructor() {
    super("agent-one-storage");
    this.version(1).stores({
      kv: "key",
    });
  }
}

const db = new AsyncStorageDB();

export const asyncLocalStorage = {
  async getItem(key: string): Promise<string | null> {
    await delay(SIMULATED_DELAY_MS);
    const entry = await db.kv.get(key);
    return entry?.value ?? null;
  },

  setItem(key: string, value: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => db.kv.put({ key, value }));
  },

  removeItem(key: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => db.kv.delete(key));
  },
};
