CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  folder TEXT,
  separate_memory INTEGER NOT NULL DEFAULT 0,
  memory TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

ALTER TABLE chat_metadata ADD COLUMN project_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_metadata_project_id ON chat_metadata (project_id);
