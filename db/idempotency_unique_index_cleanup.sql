ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_idempotency_key_key;

DROP INDEX IF EXISTS idx_transactions_idempotency_key_unique;

DROP INDEX IF EXISTS idx_transactions_idempotency_key;

CREATE UNIQUE INDEX idx_transactions_idempotency_key
ON transactions (idempotency_key)
WHERE idempotency_key IS NOT NULL;
