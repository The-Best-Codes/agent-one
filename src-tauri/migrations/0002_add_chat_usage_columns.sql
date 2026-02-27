ALTER TABLE chat_metadata ADD COLUMN input_tokens INTEGER;
ALTER TABLE chat_metadata ADD COLUMN output_tokens INTEGER;
ALTER TABLE chat_metadata ADD COLUMN total_cost_usd REAL;
