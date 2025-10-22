import type { ConflictResolutionStrategy } from "./types";

export interface ConflictResolutionContext {
  incomingVersion: number;
  incomingTimestamp: number;
  incomingWindowId: string;
  localVersion: number;
  localTimestamp: number;
  localWindowId: string;
}

export class ConflictResolver {
  static shouldAccept(context: ConflictResolutionContext): boolean {
    const {
      incomingVersion,
      incomingTimestamp,
      incomingWindowId,
      localVersion,
      localTimestamp,
      localWindowId,
    } = context;

    if (incomingVersion > localVersion) {
      return true;
    }

    if (incomingVersion === localVersion) {
      if (incomingTimestamp > localTimestamp) {
        return true;
      }

      if (incomingTimestamp === localTimestamp) {
        return incomingWindowId > localWindowId;
      }
    }

    return false;
  }

  static resolve<T>(
    incoming: T,
    local: T,
    strategy: ConflictResolutionStrategy | ((incoming: T, local: T) => T),
  ): T {
    if (typeof strategy === "function") {
      return strategy(incoming, local);
    }

    switch (strategy) {
      case "last-write-wins":
        return incoming;

      case "deep-merge":
        return ConflictResolver.deepMerge(incoming, local);

      default:
        return incoming;
    }
  }

  private static deepMerge<T>(incoming: T, local: T): T {
    if (
      typeof incoming !== "object" ||
      incoming === null ||
      typeof local !== "object" ||
      local === null ||
      Array.isArray(incoming) ||
      Array.isArray(local)
    ) {
      return incoming;
    }

    const result = { ...local };

    for (const key in incoming) {
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        const incomingValue = incoming[key as keyof typeof incoming];
        const localValue = local[key as keyof typeof local];

        if (
          typeof incomingValue === "object" &&
          incomingValue !== null &&
          typeof localValue === "object" &&
          localValue !== null &&
          !Array.isArray(incomingValue) &&
          !Array.isArray(localValue)
        ) {
          (result as Record<string, unknown>)[key] = ConflictResolver.deepMerge(
            incomingValue,
            localValue,
          );
        } else {
          (result as Record<string, unknown>)[key] = incomingValue;
        }
      }
    }

    return result as T;
  }

  static getVersionKey(entityType: string, entityId: string): string {
    return `sync:version:${entityType}:${entityId}`;
  }

  static getTimestampKey(entityType: string, entityId: string): string {
    return `sync:timestamp:${entityType}:${entityId}`;
  }

  static getWindowId(): string {
    if (typeof window !== "undefined") {
      let windowId = sessionStorage.getItem("sync:window-id");
      if (!windowId) {
        windowId = `window-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("sync:window-id", windowId);
      }
      return windowId;
    }
    return "unknown-window";
  }

  static getLocalVersion(
    entityType: string,
    entityId: string,
    defaultVersion: number = 0,
  ): number {
    try {
      const stored = localStorage.getItem(
        ConflictResolver.getVersionKey(entityType, entityId),
      );
      return stored ? parseInt(stored, 10) : defaultVersion;
    } catch {
      return defaultVersion;
    }
  }

  static setLocalVersion(
    entityType: string,
    entityId: string,
    version: number,
  ): void {
    try {
      localStorage.setItem(
        ConflictResolver.getVersionKey(entityType, entityId),
        version.toString(),
      );
    } catch {
      // Silently fail if storage is unavailable
    }
  }

  static getLocalTimestamp(
    entityType: string,
    entityId: string,
    defaultTimestamp: number = 0,
  ): number {
    try {
      const stored = localStorage.getItem(
        ConflictResolver.getTimestampKey(entityType, entityId),
      );
      return stored ? parseInt(stored, 10) : defaultTimestamp;
    } catch {
      return defaultTimestamp;
    }
  }

  static setLocalTimestamp(
    entityType: string,
    entityId: string,
    timestamp: number,
  ): void {
    try {
      localStorage.setItem(
        ConflictResolver.getTimestampKey(entityType, entityId),
        timestamp.toString(),
      );
    } catch {
      // Silently fail if storage is unavailable
    }
  }
}
