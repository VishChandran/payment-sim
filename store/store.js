const pool = require("../db/connection");

async function insertOutboxEvent(client, txn) {
  const query = `
    INSERT INTO outbox_events
    (
      txn_id,
      event_type,
      payload,
      status
    )
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (txn_id) DO NOTHING
    RETURNING *;
  `;

  const values = [
    txn.id,
    "TRANSACTION_ACCEPTED",
    JSON.stringify(txn),
    "PENDING",
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}

async function saveTransactionWithOutbox(txn) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const transactionQuery = `
      INSERT INTO transactions
      (
        txn_id,
        correlation_id,
        idempotency_key,
        request_hash,
        client_id,
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING *;
    `;

    const transactionValues = [
      txn.id,
      txn.correlationId || "N/A",
      txn.idempotencyKey || null,
      txn.requestHash || null,
      txn.clientId || null,
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

    const transactionResult = await client.query(
      transactionQuery,
      transactionValues
    );

    if (transactionResult.rowCount === 0) {
      const existingResult = await client.query(
        `
        SELECT *
        FROM transactions
        WHERE idempotency_key = $1
        `,
        [txn.idempotencyKey]
      );

      await client.query("COMMIT");

      const existingTransaction = existingResult.rows[0];

      return {
        inserted: false,
        conflict:
          !existingTransaction ||
          existingTransaction.request_hash !== txn.requestHash,
        transaction: existingTransaction,
        outboxEvent: null,
      };
    }

    const outboxEvent = await insertOutboxEvent(client, txn);

    await client.query("COMMIT");

    return {
      inserted: true,
      conflict: false,
      transaction: transactionResult.rows[0],
      outboxEvent,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function saveDeadLetterJob(job, error) {
  const query = `
    INSERT INTO dead_letter_jobs
    (
      job_id,
      txn_id,
      queue_name,
      payload,
      failed_reason,
      attempts_made
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (job_id) DO UPDATE
    SET
      failed_reason = EXCLUDED.failed_reason,
      attempts_made = EXCLUDED.attempts_made,
      payload = EXCLUDED.payload,
      failed_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const txn = job.data || {};
  const values = [
    job.id,
    txn.id || null,
    job.queueName,
    JSON.stringify(txn),
    error.message,
    job.attemptsMade,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getDeadLetterJobs() {
  const query = `
    SELECT *
    FROM dead_letter_jobs
    ORDER BY failed_at DESC
    LIMIT 100;
  `;

  const result = await pool.query(query);
  return result.rows;
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
      processing_started_at = CASE WHEN $8 THEN NULL ELSE COALESCE($9, processing_started_at) END,
      processor_instance_id = CASE WHEN $8 THEN NULL ELSE COALESCE($10, processor_instance_id) END,
      updated_at = CURRENT_TIMESTAMP
    WHERE txn_id = $11
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
    Boolean(updates.clearProcessing),
    updates.processingStartedAt ?? null,
    updates.processorInstanceId ?? null,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function startTransactionProcessing(id, processorInstanceId, processingTimeline) {
  const query = `
    UPDATE transactions
    SET
      status = 'PROCESSING',
      processor_instance_id = $2,
      processing_started_at = CURRENT_TIMESTAMP,
      processing_timeline = COALESCE($3, processing_timeline),
      updated_at = CURRENT_TIMESTAMP
    WHERE txn_id = $1
      AND status = 'ACCEPTED'
    RETURNING *;
  `;

  const result = await pool.query(query, [
    id,
    processorInstanceId,
    processingTimeline ? JSON.stringify(processingTimeline) : null,
  ]);

  return result.rows[0];
}

async function finalizeTransactionProcessing(id, processorInstanceId, updates) {
  const query = `
    UPDATE transactions
    SET
      status = COALESCE($3, status),
      retry_count = COALESCE($4, retry_count),
      worker_id = COALESCE($5, worker_id),
      route = COALESCE($6, route),
      reason = COALESCE($7, reason),
      result = COALESCE($8, result),
      processing_timeline = COALESCE($9, processing_timeline),
      processing_started_at = NULL,
      processor_instance_id = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE txn_id = $1
      AND status = 'PROCESSING'
      AND processor_instance_id = $2
    RETURNING *;
  `;

  const values = [
    id,
    processorInstanceId,
    updates.status || null,
    updates.retryCount ?? null,
    updates.workerId ?? null,
    updates.route || null,
    updates.reason || null,
    updates.result ? JSON.stringify(updates.result) : null,
    updates.processingTimeline ? JSON.stringify(updates.processingTimeline) : null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function recoverStaleProcessingTransactions(staleTimeoutMs) {
  const result = await pool.query(
    `
    WITH recovered AS (
      SELECT txn_id, processor_instance_id
      FROM transactions
      WHERE status = 'PROCESSING'
        AND processing_started_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 millisecond')
    )
    UPDATE transactions
    SET status = 'ACCEPTED',
        reason = 'Recovered stale PROCESSING transaction',
        processing_started_at = NULL,
        processor_instance_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    FROM recovered
    WHERE transactions.txn_id = recovered.txn_id
      AND transactions.status = 'PROCESSING'
      AND transactions.processing_started_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 millisecond')
    RETURNING transactions.txn_id, recovered.processor_instance_id
    `,
    [staleTimeoutMs]
  );

  for (const txn of result.rows) {
    console.log(
      `TRANSACTION_STALE_PROCESSING_RECOVERED: txn=${txn.txn_id} previousProcessor=${txn.processor_instance_id}`
    );
  }

  return result.rows;
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
  saveTransactionWithOutbox,
  updateTransaction,
  startTransactionProcessing,
  finalizeTransactionProcessing,
  recoverStaleProcessingTransactions,
  getTransaction,
  saveDeadLetterJob,
  getDeadLetterJobs,
};
