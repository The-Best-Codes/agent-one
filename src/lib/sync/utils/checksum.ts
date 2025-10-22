export function createChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

export function verifyChecksum(data: unknown, checksum: string): boolean {
  return createChecksum(data) === checksum;
}
