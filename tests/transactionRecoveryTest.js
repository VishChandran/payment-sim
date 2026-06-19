const crypto = require("crypto");
const pool = require("../db/connection");
const { runTransactionRecoveryOnce } = require("../recovery/transactionRecovery");
const {
  getTransaction,
  renewTransactionProcessingLease,
} = require("../store/store");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS processor_instance_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMP
  `);
}

async function main() {
  await ensureSchema();

  const txnId = `txn-rec-${crypto.randomUUID()}`;

  await pool.query(
    `
    INSERT INTO transactions
    (
      txn_id,
      correlation_id,
      idempotency_key,
      request_hash,
      amount,
      channel,
      status,
      from_account,
      to_account,
      type,
      retry_count,
      processing_started_at,
      processor_instance_id,
      last_heartbeat_at,
      lease_expires_at,
      processing_timeline
    )
    VALUES ($1,'N/A',$2,$3,500,'DOMESTIC_POS','PROCESSING','A123','B456','PURCHASE',0,CURRENT_TIMESTAMP - INTERVAL '10 minutes',$4,CURRENT_TIMESTAMP - INTERVAL '10 minutes',CURRENT_TIMESTAMP - INTERVAL '1 minute','[]')
    `,
    [
      txnId,
      `transaction-recovery-${txnId}`,
      crypto.createHash("sha256").update(txnId).digest("hex"),
      "test-recovery-worker",
    ]
  );

  const recovered = await runTransactionRecoveryOnce(1000);
  const transaction = await getTransaction(txnId);

  assert(
    recovered.some((row) => row.txn_id === txnId),
    "expected stale PROCESSING transaction to be recovered"
  );
  assert(transaction.status === "ACCEPTED", "expected transaction status to reset to ACCEPTED");
  assert(
    transaction.processing_started_at === null,
    "expected processing_started_at to be cleared"
  );
  assert(
    transaction.processor_instance_id === null,
    "expected processor_instance_id to be cleared"
  );
  assert(transaction.last_heartbeat_at === null, "expected heartbeat to be cleared");
  assert(transaction.lease_expires_at === null, "expected lease to be cleared");

  const liveTxnId = `txn-live-${crypto.randomUUID()}`;
  await pool.query(
    `
    INSERT INTO transactions
    (
      txn_id, correlation_id, idempotency_key, request_hash, amount, channel,
      status, retry_count, processing_started_at, processor_instance_id,
      last_heartbeat_at, lease_expires_at, processing_timeline
    )
    VALUES ($1, 'N/A', $2, $3, 500, 'DOMESTIC_POS', 'PROCESSING', 0,
      CURRENT_TIMESTAMP - INTERVAL '10 minutes', $4,
      CURRENT_TIMESTAMP - INTERVAL '10 minutes',
      CURRENT_TIMESTAMP - INTERVAL '1 minute', '[]')
    `,
    [
      liveTxnId,
      `transaction-recovery-${liveTxnId}`,
      crypto.createHash("sha256").update(liveTxnId).digest("hex"),
      "test-live-worker",
    ]
  );

  const renewedLease = await renewTransactionProcessingLease(
    liveTxnId,
    "test-live-worker",
    120000
  );
  assert(renewedLease, "expected worker heartbeat to renew its lease");

  const secondRecovery = await runTransactionRecoveryOnce(1000);
  const liveTransaction = await getTransaction(liveTxnId);
  assert(
    !secondRecovery.some((row) => row.txn_id === liveTxnId),
    "expected active lease not to be recovered"
  );
  assert(liveTransaction.status === "PROCESSING", "expected active transaction to remain PROCESSING");

  await pool.query("DELETE FROM transactions WHERE txn_id = ANY($1)", [[txnId, liveTxnId]]);
  await pool.end();

  console.log("PASS expired lease recovered and active lease preserved");
}

main().catch(async (error) => {
  console.error("FAIL", error.message);
  await pool.end();
  process.exit(1);
});
