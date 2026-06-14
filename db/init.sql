CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  txn_id VARCHAR(50) UNIQUE NOT NULL,
  correlation_id VARCHAR(100) NOT NULL,
  client_id VARCHAR(100),
  idempotency_key VARCHAR(100) UNIQUE,
  request_hash VARCHAR(128),
  amount NUMERIC(12,2) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  card_number VARCHAR(25),
  card_last4 VARCHAR(4),
  card_fingerprint VARCHAR(128),
  status VARCHAR(30) NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  from_account VARCHAR(50),
  to_account VARCHAR(50),
  type VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  worker_id INTEGER,
  processing_started_at TIMESTAMP,
  processor_instance_id VARCHAR(100),
  route VARCHAR(50),
  reason TEXT,
  result JSONB,
  processing_timeline JSONB
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id SERIAL PRIMARY KEY,
  txn_id VARCHAR(50) UNIQUE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  claim_count INTEGER NOT NULL DEFAULT 0,
  recovery_count INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP,
  locked_by VARCHAR(100),
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_id
ON outbox_events (status, id);

CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(100) UNIQUE NOT NULL,
  txn_id VARCHAR(50),
  queue_name VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  failed_reason TEXT NOT NULL,
  attempts_made INTEGER NOT NULL,
  failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_jobs_txn_id
ON dead_letter_jobs (txn_id);
