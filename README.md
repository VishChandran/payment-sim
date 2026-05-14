# Payment Processing Simulator

A backend payment processing simulator built with Node.js and Express that models enterprise-style payment transaction flows.

The project simulates how payment systems process, validate, route, retry, and track transactions asynchronously using queue-based workers and routing logic.

---

# Features

- REST API for payment transactions
- Async queue-based processing
- Multi-worker transaction handling
- Internal and external payment routing
- Retry handling and failure recovery
- Dead Letter Queue (DLQ)
- Transaction lifecycle tracking
- Structured logging
- Security middleware
- Rate limiting
- Environment-based configuration
- Automated API testing

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
Validation Layer
  ↓
Queue
  ↓
Async Worker
  ↓
Processor / Orchestrator
  ↓
Routing Decision
├── Internal Banking Systems
├── External Processor
└── Mastercard / TSYS Simulation
```

---

# Tech Stack

- Node.js
- Express.js
- JavaScript
- Git
- GitHub

---

# Folder Structure

```text
payment-sim/
├── app.js
├── package.json
├── broker/
├── config/
├── logger/
├── processor/
├── queue/
├── risk/
├── store/
├── systems/
├── utils/
└── validation/
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
PORT=5001 WORKER_COUNT=5 node app.js
```

---

# Automated Testing

Run automated API test:

```bash
npm run test-payment
```

---

# How To Run

Install dependencies:

```bash
npm install
```

Start application:

```bash
npm start
```

Server runs on:

```bash
http://localhost:3000
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

- Redis/BullMQ queues
- Docker deployment
- MongoDB/PostgreSQL persistence
- ISO8583 simulation
- Kafka event streaming
- AWS deployment
- Fraud/risk engine improvements
- Monitoring and metrics

---

# Learning Outcomes

This project demonstrates:

- Backend API development
- Async processing patterns
- Queue and worker architecture
- Retry and DLQ handling
- Payment routing concepts
- Observability and logging
- Security middleware integration
- Enterprise backend architecture concepts