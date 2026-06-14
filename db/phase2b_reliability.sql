ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processor_instance_id VARCHAR(100);

ALTER TABLE outbox_events
ADD COLUMN IF NOT EXISTS claim_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_count INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'outbox_events'
      AND column_name = 'attempt_count'
  ) THEN
    UPDATE outbox_events
    SET claim_count = attempt_count
    WHERE claim_count = 0
      AND attempt_count > 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_status_processing_started
ON transactions (status, processing_started_at);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_claimed
ON outbox_events (status, claimed_at);
