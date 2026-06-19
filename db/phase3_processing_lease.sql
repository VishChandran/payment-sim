ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_transactions_processing_lease
ON transactions (status, lease_expires_at);
