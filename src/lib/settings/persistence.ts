const SETTINGS_STORAGE_KEY = "agent-one-settings";

export function getStoredSettings(): Record<string, unknown> {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Record<string, unknown>): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function getSetting<T>(key: string, defaultValue: T): T {
  const settings = getStoredSettings();
  return settings[key] !== undefined ? (settings[key] as T) : defaultValue;
}

export function saveSetting<T>(key: string, value: T): void {
  const settings = getStoredSettings();
  settings[key] = value;
  saveSettings(settings);
}
