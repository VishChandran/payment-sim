const crypto = require("crypto");
const pool = require("../db/connection");
const { runTransactionRecoveryOnce } = require("../recovery/transactionRecovery");
const { getTransaction } = require("../store/store");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const txnId = `transaction-recovery-${crypto.randomUUID()}`;

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
      processing_timeline
    )
    VALUES ($1,'N/A',$2,$3,500,'DOMESTIC_POS','PROCESSING','A123','B456','PURCHASE',0,CURRENT_TIMESTAMP - INTERVAL '10 minutes',$4,'[]')
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

  await pool.query("DELETE FROM transactions WHERE txn_id = $1", [txnId]);
  await pool.end();

  console.log("PASS stale PROCESSING transaction scheduled recovery path");
}

main().catch(async (error) => {
  console.error("FAIL", error.message);
  await pool.end();
  process.exit(1);
});
