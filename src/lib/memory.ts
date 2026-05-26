export const MAX_MEMORY_ENTRIES = 100;
export const MAX_MEMORY_ENTRY_CHARS = 500;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ");
}

function getMemoryEntryKey(value: string): string {
  return normalizeWhitespace(value).trim().toLocaleLowerCase();
}

export function sanitizeMemoryEntry(value: string): string {
  return normalizeWhitespace(value).trim().slice(0, MAX_MEMORY_ENTRY_CHARS);
}

export function sanitizeMemoryEntries(memory: string[]): string[] {
  const entries: string[] = [];
  const seen = new Set<string>();

  for (const rawEntry of memory) {
    const entry = sanitizeMemoryEntry(rawEntry);
    if (!entry) continue;

    const key = entry.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    entries.push(entry);

    if (entries.length >= MAX_MEMORY_ENTRIES) break;
  }

  return entries;
}

export function hasMemoryEntry(entries: string[], value: string): boolean {
  const key = getMemoryEntryKey(value);
  return entries.some((entry) => getMemoryEntryKey(entry) === key);
}

export function removeMemoryEntries(entries: string[], valuesToRemove: string[]): string[] {
  const removeKeys = new Set(valuesToRemove.map((value) => getMemoryEntryKey(value)));
  return entries.filter((entry) => !removeKeys.has(getMemoryEntryKey(entry)));
}
