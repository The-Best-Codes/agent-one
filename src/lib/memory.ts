export const MAX_MEMORY_CHARS = 40000;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeMemoryText(value: string): string {
  return value.slice(0, MAX_MEMORY_CHARS);
}

export function normalizeMemoryEntry(value: string): string {
  return normalizeWhitespace(value.replace(/^\s*[-*]\s+/, ""));
}

function getMemoryEntryKey(value: string): string {
  return normalizeMemoryEntry(value).toLocaleLowerCase();
}

export function getMemoryEntries(memory: string): string[] {
  const entries: string[] = [];
  const seen = new Set<string>();

  for (const line of memory.split(/\r?\n/)) {
    const entry = normalizeMemoryEntry(line);
    if (!entry) continue;

    const key = getMemoryEntryKey(entry);
    if (seen.has(key)) continue;

    seen.add(key);
    entries.push(entry);
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

export function serializeMemoryEntries(entries: string[]): string {
  return sanitizeMemoryText(entries.join("\n"));
}
