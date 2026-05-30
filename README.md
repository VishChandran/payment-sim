# Payment Processing Simulator

A backend payment processing simulator built with Node.js and Express that models enterprise-style payment transaction flows.

The project simulates how payment systems process, validate, route, retry, and track transactions asynchronously using queue-based workers and routing logic.

---

# Features

- REST API for payment transaction processing
- PostgreSQL transaction persistence
- Redis-backed BullMQ queue processing
- Asynchronous worker architecture
- Transaction lifecycle tracking
- Internal and external payment routing
- TSYS and Mastercard network simulation
- Retry handling and failure recovery
- Dead Letter Queue (DLQ)
- Structured logging and observability
- Risk and validation engine
- Security middleware and rate limiting
- Dockerized deployment with Docker Compose
- Environment-based configuration

---

# Architecture Overview

```text
Client
  ↓
Express API
  ↓
Validation & Risk Engine
  ↓
BullMQ Queue
  ↓
Redis
  ↓
BullMQ Worker
  ↓
Routing Engine
  ├── INTERNAL
  ├── TSYS
  └── MASTERCARD
  ↓
PostgreSQL
```

---

# Engineering Concepts Explored

This project was built to better understand the technical and operational challenges involved in modern payment platforms.

Areas explored include:

- Asynchronous transaction processing
- Queue-based workload distribution
- Internal and external payment routing
- Retry and recovery patterns
- Dead Letter Queue handling
- Transaction lifecycle management
- Structured logging and observability
- Security and validation controls
- Service modularity and maintainability
- Containerized application deployment

---

# Real-World Payment Concepts Simulated

- Purchase authorization flows
- Cash withdrawal processing
- Balance inquiry handling
- Reversal processing
- Internal and external routing decisions
- Payment network integration patterns
- Transaction status tracking
- Failure recovery and retry handling
- Operational monitoring and observability

---

# Tech Stack

## Application Layer

- Node.js
- Express.js
- JavaScript

## Data Layer

- PostgreSQL

## Queue & Processing Layer

- Redis
- BullMQ

## Infrastructure

- Docker
- Docker Compose

## Tooling

- Git
- GitHub

---

# Folder Structure

```text
payment-sim/
├── app.js
├── broker/
├── config/
├── db/
│   ├── connection.js
│   └── init.sql
├── jobs/
│   ├── transactionQueue.js
│   └── transactionWorker.js
├── logger/
├── processor/
├── queue/
├── risk/
├── store/
├── systems/
├── utils/
├── validation/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

# API Endpoints

## Health Check

```http
GET /
```

## Submit Payment

```http
POST /pay
```

### Example Request

```json
{
  "amount": 500,
  "fromAccount": "A123",
  "toAccount": "B456",
  "type": "PURCHASE",
  "issuerType": "INTERNAL",
  "pin": "1234"
}
```

### Example Response

```json
{
  "status": "ACCEPTED",
  "transactionId": "uuid-value"
}
```

## Check Transaction Status

```http
GET /status/:id
```

### Example Response

```json
{
  "status": "COMPLETED",
  "route": "INTERNAL"
}
```

## View Dead Letter Queue

```http
GET /dead-letter
```

---

# Transaction Lifecycle

```text
ACCEPTED
    ↓
PROCESSING
    ↓
COMPLETED / DECLINED / FAILED
    ↓
Dead Letter Queue (if retries exhausted)
```

---

# Security Features

- Helmet middleware
- CORS protection
- Request size limiting
- API rate limiting
- Sensitive data masking in logs

---

# Environment Configuration

Example:

```bash
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_sim
REDIS_HOST=127.0.0.1
```

---

# Automated Testing

Run automated API test:

```bash
npm run test-payment
```

---

# Local Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL and Redis locally.

Run application:

```bash
node app.js
```

Application URL:

```text
http://localhost:3000
```

---

# Docker Deployment

Build and start all services:

```bash
docker compose up --build
```

Services:

```text
Application : localhost:3000
PostgreSQL  : localhost:5432
Redis       : localhost:6379
```

---

# Example CURL Command

```bash
curl -X POST http://localhost:3000/pay \
-H "Content-Type: application/json" \
-d '{
  "amount": 500,
  "fromAccount": "A123",
  "toAccount": "B456",
  "type": "PURCHASE",
  "issuerType": "INTERNAL",
  "pin": "1234"
}'
```

---

# Future Enhancements

- ISO8583 message simulation
- Kafka event streaming
- Fraud scoring enhancements
- Settlement processing engine
- Multi-region deployment patterns
- AWS deployment automation
- Metrics and monitoring dashboards
- Distributed tracing
- High-volume load testing

---

# Key Takeaways

This project provided hands-on experience with:

- Payment transaction processing
- Queue-based architectures
- Worker orchestration
- Retry and recovery mechanisms
- Dead Letter Queue management
- Transaction persistence and auditability
- Service modularity and separation of concerns
- Containerized deployments
- Operational observability and monitoring
- Scalability and resiliency patterns