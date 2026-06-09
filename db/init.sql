cat > db/init.sql <<'EOF'
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  txn_id VARCHAR(50) UNIQUE NOT NULL,
  correlation_id VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(100) UNIQUE,
  request_hash VARCHAR(128),
  amount NUMERIC(12,2) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  card_number VARCHAR(25),
  status VARCHAR(30) NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  from_account VARCHAR(50),
  to_account VARCHAR(50),
  type VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  worker_id INTEGER,
  route VARCHAR(50),
  reason TEXT,
  result JSONB,
  processing_timeline JSONB
);
EOF

psql "$DATABASE_URL" -c "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);"
psql "$DATABASE_URL" -c "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS request_hash VARCHAR(128);"
psql "$DATABASE_URL" -c "CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;"