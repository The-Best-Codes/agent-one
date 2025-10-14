export function jsonParseCatch(value: string | null | undefined) {
  if (value === null || value === undefined) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
