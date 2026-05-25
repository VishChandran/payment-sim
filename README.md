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

# TPM / Enterprise Delivery & Project Management Learning Outcomes

This project was designed not only as a backend engineering exercise, but also as a simulation of how enterprise-scale payment modernization initiatives are planned, governed, delivered, monitored, and operationalized.

## Architecture & System Design

- Asynchronous payment processing architecture
- Queue-based worker orchestration
- Internal vs external payment routing
- Config-driven enterprise architecture
- Multi-worker concurrency and scaling patterns
- Modular backend service decomposition

## Resiliency & Reliability Engineering

- Retry strategies for transient failures
- Dead Letter Queue (DLQ) handling
- Failure isolation and transaction recovery
- Transaction lifecycle observability
- Structured logging and operational monitoring
- High-availability processing concepts

## Risk, Controls & Security

- PCI-style sensitive data masking
- Fraud/risk rule evaluation engine
- Channel-aware transaction controls
- Validation and transaction integrity checks
- Operational risk reduction through defensive processing patterns

## Project Management & TPM Concepts Simulated

- Breaking down a complex payment platform into incremental delivery phases
- Managing dependencies between routing, processing, risk, and operational modules
- Designing scalable and maintainable architecture for long-term supportability
- Simulating enterprise operational support concerns such as monitoring, retries, recovery, and transaction tracing
- Applying separation of concerns to reduce code conflicts and improve team collaboration
- Building reusable and configurable components to support future enhancements
- Structuring development in iterative delivery milestones similar to Agile/Scrum implementation phases
- Balancing functional requirements with operational resiliency and security considerations
- Demonstrating systems-thinking across architecture, operations, risk, and support models

## Enterprise Delivery & Operational Thinking

- API contract-driven development
- Transaction lifecycle tracking
- Operational observability endpoints
- Worker scaling simulation
- Queue-driven asynchronous processing
- Service orchestration concepts used in enterprise payment platforms

## Real-World Banking & Payments Concepts Simulated

- Purchase authorization flows
- Cash withdrawal processing
- Balance inquiry orchestration
- Reversal handling
- External processor integrations
- TSYS and Mastercard routing simulation
- Internal banking subsystem orchestration
- Channel-based transaction handling (ATM, POS, ECOM)

This project helped strengthen understanding of how enterprise payment systems are architected, delivered, scaled, monitored, governed, and operationalized across both technical engineering and technical program management domains.

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

# Tech Stack

### Application Layer

- Node.js
- Express.js
- JavaScript

### Data Layer

- PostgreSQL

### Queue & Processing Layer

- Redis
- BullMQ

### Infrastructure

- Docker
- Docker Compose

### Tooling

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

GET /

---

## Submit Payment

POST /pay

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

---

## Check Transaction Status

GET /status/:id

### Example Response

```json
{
  "status": "COMPLETED",
  "route": "INTERNAL"
}
```

---

## View Dead Letter Queue

GET /dead-letter

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hybrid_banking
REDIS_HOST=127.0.0.1
```

---

# Automated Testing

Run automated API test:

```bash
npm run test-payment
```

---

# How To Run

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

Application:

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
Application  : localhost:3000
PostgreSQL   : localhost:5432
Redis        : localhost:6379


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

# Learning Outcomes

This project demonstrates practical experience with:

### Payment Processing Concepts

- Transaction authorization flows
- Internal vs external routing
- Payment network integration patterns
- Transaction lifecycle management
- Settlement and reconciliation foundations

### Distributed Systems Concepts

- Asynchronous processing
- Queue-based architectures
- Worker orchestration
- Retry and failure recovery patterns
- Dead Letter Queue handling
- Event-driven processing models

### Data Engineering Concepts

- Transaction persistence
- Auditability and traceability
- Status lifecycle tracking
- JSON-based processing timelines

### Infrastructure & DevOps Concepts

- Containerization with Docker
- Multi-service orchestration with Docker Compose
- Environment-driven configuration
- Service dependency management

### Enterprise Architecture Concepts

- Separation of concerns
- Modular service design
- Routing engine ownership
- Operational observability
- Resiliency and scalability trade-offs