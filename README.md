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

# Architecture Overview

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

---

# Tech Stack

- Node.js
- Express.js
- JavaScript
- Git
- GitHub

---

# Folder Structure

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
├── tests/
├── utils/
└── validation/

---

# API Endpoints

## Health Check

GET /

---

## Submit Payment

POST /pay

Example Request:

json {   "amount": 500,   "fromAccount": "A123",   "toAccount": "B456",   "type": "PURCHASE",   "issuerType": "INTERNAL",   "pin": "1234" } 

Example Response:

json {   "status": "ACCEPTED",   "transactionId": "uuid-value" } 

---

## Check Transaction Status

GET /status/:id

Example Response:

json {   "status": "COMPLETED",   "route": "INTERNAL" } 

---

## View Dead Letter Queue

GET /dead-letter

---

# Transaction Lifecycle

ACCEPTED
↓
PROCESSING
↓
COMPLETED / DECLINED / FAILED
↓
Dead Letter Queue (if retries exhausted)

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

bash PORT=5001 WORKER_COUNT=5 node app.js 

---

# Automated Testing

Run automated API test:

bash npm run test-payment 

---

# How To Run

Install dependencies:

bash npm install 

Start application:

bash npm start 

Server runs on:

bash http://localhost:3000 

---

# Example CURL Command

bash curl -X POST http://localhost:3000/pay \ -H "Content-Type: application/json" \ -d '{   "amount": 500,   "fromAccount": "A123",   "toAccount": "B456",   "type": "PURCHASE",   "issuerType": "INTERNAL",   "pin": "1234" }' 

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