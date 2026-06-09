const pool = require("../db/connection");

async function saveTransaction(txn) {
  const query = `
    INSERT INTO transactions
    (
      txn_id,
      correlation_id,
      idempotency_key,
      request_hash,
      amount,
      channel,
      card_number,
      status,
      from_account,
      to_account,
      type,
      retry_count,
      processing_timeline
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (txn_id) DO NOTHING
    RETURNING *;
  `;

  const values = [
    txn.id,
    txn.correlationId || "N/A",
    txn.idempotencyKey || null,
    txn.requestHash || null,
    txn.amount,
    txn.channel,
    txn.cardNumber || null,
    txn.status || "ACCEPTED",
    txn.fromAccount || null,
    txn.toAccount || null,
    txn.type || null,
    txn.retryCount || 0,
    JSON.stringify(txn.processingTimeline || []),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findTransactionByIdempotencyKey(idempotencyKey) {
  const query = `
    SELECT *
    FROM transactions
    WHERE idempotency_key = $1;
  `;

  const result = await pool.query(query, [idempotencyKey]);
  return result.rows[0];
}

async function updateTransaction(id, updates) {
  const query = `
    UPDATE transactions
    SET
      status = COALESCE($1, status),
      retry_count = COALESCE($2, retry_count),
      worker_id = COALESCE($3, worker_id),
      route = COALESCE($4, route),
      reason = COALESCE($5, reason),
      result = COALESCE($6, result),
      processing_timeline = COALESCE($7, processing_timeline),
      updated_at = CURRENT_TIMESTAMP
    WHERE txn_id = $8
    RETURNING *;
  `;

  const values = [
    updates.status || null,
    updates.retryCount ?? null,
    updates.workerId ?? null,
    updates.route || null,
    updates.reason || null,
    updates.result ? JSON.stringify(updates.result) : null,
    updates.processingTimeline ? JSON.stringify(updates.processingTimeline) : null,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getTransaction(id) {
  const query = `
    SELECT *
    FROM transactions
    WHERE txn_id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = {
  saveTransaction,
  updateTransaction,
  getTransaction,
  findTransactionByIdempotencyKey,
};
