export type ConflictResolutionStrategy =
  | "last-write-wins"
  | "deep-merge"
  | "custom";

export interface SyncMessage<T = unknown> {
  id: string;
  entityType: string;
  entityId: string;
  operation: "update" | "delete";
  payload: T;
  version: number;
  timestamp: number;
  windowId: string;
  checksum: string;
}

export interface SyncEntity {
  version: number;
  timestamp: number;
}

export interface SyncAdapterConfig<T, C> {
  entityType: string;
  selector: (context: C) => T;
  onRemoteChange: (payload: T, context: C) => void | Promise<void>;
  conflictResolution?:
    | ConflictResolutionStrategy
    | ((incoming: T, local: T) => T);
  shouldSync?: (data: T) => boolean;
}

export interface SyncAdapterInstance<T, C> {
  config: SyncAdapterConfig<T, C>;
  entityType: string;
  getLocalData: (context: C) => T;
  handleRemoteChange: (message: SyncMessage<T>, context: C) => Promise<void>;
  getLocalVersion: (entityId: string) => number;
  incrementVersion: (entityId: string) => void;
}

export interface VersionInfo {
  version: number;
  timestamp: number;
  windowId: string;
}
