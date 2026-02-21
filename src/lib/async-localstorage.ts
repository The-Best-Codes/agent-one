const SIMULATED_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const asyncLocalStorage = {
  async getItem(key: string): Promise<string | null> {
    await delay(SIMULATED_DELAY_MS);
    return localStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => {
      localStorage.setItem(key, value);
    });
  },

  removeItem(key: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => {
      localStorage.removeItem(key);
    });
  },
};
