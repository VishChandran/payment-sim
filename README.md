# Payment Processing Simulator

`payment-sim` is a learning simulator for resilient payment processing. It models a small payment backend with an API, PostgreSQL persistence, an outbox processor, Redis/BullMQ queueing, and worker-based transaction processing.

It is intentionally small enough to read end to end, while still demonstrating reliability patterns used in real payment systems. It is not a production payment processor.

## Architecture

```text
Client / Merchant
  |
  v
API process (api.js)
  - API key auth
  - validation
  - risk checks
  - idempotency handling
  |
  v
PostgreSQL
  - transactions
  - outbox_events
  - dead_letter_jobs
  |
  v
Outbox process (outbox.js)
  - claims pending events
  - recovers stale outbox events
  - enqueues BullMQ jobs
  - runs stuck transaction recovery
  |
  v
Redis / BullMQ
  |
  v
Worker process (worker.js)
  - idempotent job handling
  - processing lease heartbeats
  - transaction routing
  - retries
  - durable dead-letter records
```

## Key Features

- Separate API, worker, and outbox entrypoints.
- `/pay` endpoint for accepting payment-like transactions.
- `/status/:id` endpoint with client ownership checks.
- Admin-protected `/dead-letter` and `/info` endpoints.
- PostgreSQL-backed transaction lifecycle state.
- Redis/BullMQ-backed asynchronous processing.
- Internal/external routing simulation.
- Development Docker Compose setup.

## Reliability Patterns

- Atomic transaction insert plus outbox insert in one PostgreSQL transaction.
- Outbox claiming with `FOR UPDATE SKIP LOCKED`.
- Race-safe idempotency using a canonical partial unique index on `transactions.idempotency_key`.
- Same idempotency key + same payload returns the original transaction.
- Same idempotency key + different payload returns `409`.
- BullMQ retries with exponential backoff.
- Durable `dead_letter_jobs` table for failed jobs.
- Idempotent worker behavior: finalized transactions are not reprocessed.
- Renewable worker leases distinguish actively processing transactions from abandoned work.
- Recovery resets `PROCESSING` transactions only after their lease expires, with a timeout fallback for legacy rows.
- Graceful shutdown handlers for API, worker, and outbox processes.

## Security And Data Handling

- API key auth for payment APIs.
- Multiple client API keys via `API_KEYS`.
- Client ownership stored on transactions and enforced on status reads.
- Separate admin API key support for admin endpoints.
- Constant-time API key comparison.
- Production startup checks for required API/admin keys.
- Production CORS allowlist via `ALLOWED_ORIGINS`.
- PIN is removed before persistence, queueing, DLQ storage, logs, and responses.
- Plaintext card number is not persisted; the simulator stores `card_last4` and an HMAC `card_fingerprint`.
- Outbox payloads, BullMQ job data, dead-letter payloads, and status responses are sanitized.

## Running Locally

Install dependencies:

```bash
npm install
```

Run the development stack:

```bash
docker compose up --build
```

This starts:

- API on `http://localhost:3000`
- Worker process
- Outbox/recovery process
- PostgreSQL
- Redis

The Compose file is development-only and uses local ports and default credentials.

You can also run processes manually if Postgres and Redis are already available:

```bash
npm run dev
npm run worker
npm run outbox
```

Useful environment variables:

```text
API_KEYS=merchant-a:secret-a,merchant-b:secret-b
ADMIN_API_KEYS=admin-secret
CARD_FINGERPRINT_SECRET=local-secret
ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/payment_sim
REDIS_HOST=127.0.0.1
TRANSACTION_PROCESSING_LEASE_MS=120000
TRANSACTION_HEARTBEAT_INTERVAL_MS=30000
```

Existing databases need the lease schema update in `db/phase3_processing_lease.sql`.

## Example Payment

```bash
curl -X POST http://localhost:3000/pay \
  -H "Content-Type: application/json" \
  -H "x-api-key: secret-a" \
  -H "x-idempotency-key: demo-001" \
  -d '{
    "amount": 500,
    "fromAccount": "A123",
    "toAccount": "B456",
    "type": "PURCHASE",
    "channel": "DOMESTIC_POS",
    "issuerType": "INTERNAL",
    "pin": "TEST_PIN"
  }'
```

## Test Commands

Core checks:

```bash
npm run test:core
```

Individual scripts:

```bash
npm run test-auth
npm run test-cors
npm run test-status-auth
npm run test-transaction-recovery
npm run test-sensitive-data
npm run test-reliability
```

`test-reliability` expects the API, PostgreSQL, and Redis to be running.

## Known Limitations

- This is a learning simulator, not a production payment system.
- There is no migration framework yet; schema changes are SQL scripts.
- Docker Compose is dev-only and uses default credentials.
- Worker recovery uses renewable leases, but it does not guarantee exactly-once external side effects if a worker loses its lease while a downstream operation is still running.
- Queue enqueue and database state are not atomically committed together.
- Observability is basic logging only; there are no metrics, traces, dashboards, or alerts.
- Rate limiting is in-memory and not suitable for multi-instance production.
- `from_account` and `to_account` are still stored as plaintext simulator identifiers.
- There is no CI pipeline or automated fresh-database integration test harness yet.
