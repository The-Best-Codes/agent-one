ALTER TABLE chat_metadata ADD COLUMN created_at INTEGER;
ALTER TABLE chat_metadata ADD COLUMN updated_at INTEGER;

UPDATE chat_metadata
SET
  created_at = COALESCE(created_at, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at = COALESCE(updated_at, created_at, CAST(strftime('%s', 'now') AS INTEGER) * 1000);

DELETE FROM kv WHERE key = 'chat-ids';
