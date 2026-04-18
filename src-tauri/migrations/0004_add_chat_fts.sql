CREATE VIRTUAL TABLE IF NOT EXISTS chat_fts USING fts5(
  chat_id UNINDEXED,
  title,
  content,
  tokenize='unicode61'
);
