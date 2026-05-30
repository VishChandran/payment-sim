# Payment Processing Simulator

A backend payment processing simulator built with Node.js, Express, PostgreSQL, Redis, and BullMQ.

The project demonstrates asynchronous transaction processing, queue-based worker orchestration, routing decisions, retry handling, and transaction lifecycle tracking.

## Features

- REST API for transaction processing
- PostgreSQL persistence
- Redis and BullMQ queue processing
- Asynchronous worker architecture
- Transaction status tracking
- Retry handling and Dead Letter Queue (DLQ)
- Internal and external routing
- Structured logging
- Docker deployment

## Architecture

```text
Client
  ↓
API
  ↓
Validation
  ↓
Queue
  ↓
Worker
  ↓
Processor
  ↓
Routing
  ↓
Database
```

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Redis
- BullMQ
- Docker

## Running Locally

```bash
npm install
node app.js
```

## Running with Docker

```bash
docker compose up --build
```

## API Endpoints

| Method | Endpoint |
|----------|----------|
| GET | / |
| POST | /pay |
| GET | /status/:id |
| GET | /dead-letter |

## Example Request

```json
{
  "amount": 500,
  "fromAccount": "ACC1001",
  "toAccount": "ACC2001",
  "type": "PURCHASE",
  "network": "CARD_NETWORK"
}
```

## Key Concepts

- Asynchronous processing
- Queue-based architecture
- Retry and recovery patterns
- Persistence abstraction
- Centralized routing
- Containerized deployment
