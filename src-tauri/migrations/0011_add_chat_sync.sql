CREATE TABLE IF NOT EXISTS chat_sync (
  chat_id TEXT PRIMARY KEY NOT NULL,
  rev INTEGER NOT NULL DEFAULT 0,
  remote_rev INTEGER NOT NULL DEFAULT 0,
  remote_deleted INTEGER NOT NULL DEFAULT 0,
  remote_disabled INTEGER NOT NULL DEFAULT 0,
  local_version INTEGER NOT NULL DEFAULT 1,
  synced_version INTEGER NOT NULL DEFAULT 0,
  local_deleted INTEGER NOT NULL DEFAULT 0,
  excluded INTEGER NOT NULL DEFAULT 0,
  skipped_version INTEGER NOT NULL DEFAULT 0,
  remote_updated_at INTEGER NOT NULL DEFAULT 0,
  first_device_id TEXT,
  first_device_name TEXT,
  last_device_id TEXT,
  last_device_name TEXT,
  last_synced_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);
