const pool = require("../db/connection");
const { transactionQueue } = require("../jobs/transactionQueue");

async function processOutboxEvents() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT id, txn_id, payload
      FROM outbox_events
      WHERE status = 'PENDING'
      ORDER BY id
      LIMIT 10
    `);

    for (const event of result.rows) {
      try {
        await transactionQueue.add(
          "process-transaction",
          event.payload,
          { jobId: event.txn_id }
        );

        await client.query(
          `
          UPDATE outbox_events
          SET status = 'SENT',
              attempts = attempts + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [event.id]
        );

        console.log(`OUTBOX_EVENT_SENT: ${event.txn_id}`);
      } catch (error) {
        await client.query(
          `
          UPDATE outbox_events
          SET attempts = attempts + 1,
              last_error = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [error.message, event.id]
        );

        console.error(`OUTBOX_EVENT_FAILED: ${event.txn_id}`, error.message);
      }
    }
  } finally {
    client.release();
  }
}

setInterval(processOutboxEvents, 5000);

module.exports = { processOutboxEvents };
