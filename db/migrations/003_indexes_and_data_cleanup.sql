ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_idempotency_key_key;

DROP INDEX IF EXISTS idx_transactions_idempotency_key_unique;
DROP INDEX IF EXISTS idx_transactions_idempotency_key;

CREATE UNIQUE INDEX idx_transactions_idempotency_key
ON transactions (idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_id
ON outbox_events (status, id);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_claimed
ON outbox_events (status, claimed_at);

CREATE INDEX IF NOT EXISTS idx_transactions_processing_lease
ON transactions (status, lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_dead_letter_jobs_txn_id
ON dead_letter_jobs (txn_id);

UPDATE transactions
SET card_number = NULL
WHERE card_number IS NOT NULL;
