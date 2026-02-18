let token: string | null = null;

export function getSyncToken(): string | null {
  return token;
}

export function setSyncTokenValue(newToken: string): void {
  token = newToken;
}

export function clearSyncTokenValue(): void {
  token = null;
}
