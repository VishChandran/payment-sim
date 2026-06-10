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

## Architecture Review Enhancements

This project was initially built to simulate a payment processing platform covering transaction validation, routing, asynchronous processing, retries, dead-letter handling, and PostgreSQL persistence.

Following an architecture review, several production-readiness improvements were implemented:

### API Authentication
Added API Key based authentication to prevent anonymous access to payment APIs and transaction status endpoints.

### Idempotency Controls
Implemented idempotency keys and request hashing to prevent duplicate payment processing during client retries and network failures.

### Outbox Pattern
Implemented the Outbox Pattern to ensure transaction events are persisted before being published for asynchronous processing. This prevents transaction loss in scenarios where database writes succeed but message publication fails.

### Input Validation Improvements
Enhanced request validation to ensure mandatory transaction attributes are validated before persistence and processing.

### Why These Enhancements Were Added

The initial version of the project focused on understanding payment processing flows, routing decisions, asynchronous workers, retries, and transaction lifecycle management.

As the project evolved, additional architecture reviews were performed to identify production-grade resiliency, security, and consistency improvements commonly found in enterprise payment systems. The enhancements above were added as part of that review process.
