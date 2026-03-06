CREATE TABLE IF NOT EXISTS secure_secret_fallback (
  logical_key TEXT PRIMARY KEY NOT NULL,
  keyring_ref TEXT NOT NULL,
  nonce TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER))
);

CREATE INDEX IF NOT EXISTS idx_secure_secret_fallback_keyring_ref
ON secure_secret_fallback (keyring_ref);
