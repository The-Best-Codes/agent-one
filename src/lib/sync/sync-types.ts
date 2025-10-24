export interface SyncOptions {
  timeout?: number;
  logging?: boolean;
  deepCompare?: boolean;
}

export interface SyncState<T> {
  data: T;
  version: number;
  timestamp: number;
}

export interface SyncDataHandle {
  isSynced: boolean;
  isProcessing: boolean;
  version: number;
}

export interface SyncConfig {
  key: string;
  timeout: number;
  logging: boolean;
  deepCompare: boolean;
}

export interface SyncEngineInstance {
  isProcessingUpdate: boolean;
  hasHydrated: boolean;
  listeners: Array<() => void>;
  config: SyncConfig;
}
