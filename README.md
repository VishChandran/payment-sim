Payment Processing Simulator

A backend payment processing simulator built with Node.js and Express that models enterprise-style payment transaction flows.

This project evolved from a simple API into a multi-stage asynchronous payment orchestration platform with:

* Validation layers
* Queue-based async processing
* Retry handling
* Dead Letter Queue (DLQ)
* Structured logging
* Internal banking systems
* External processor routing
* Mastercard network simulation

⸻

Project Goals

This project was built to learn and simulate:

* Payment processing architecture
* Enterprise backend design
* Transaction orchestration
* Async worker systems
* Reliability engineering patterns
* Payment routing concepts
* Mainframe modernization patterns
* Distributed system fundamentals

⸻

Architecture Overview

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
   ├─ Internal Banking Systems
   │     ├─ System A (PIN Validation)
   │     └─ System B (Balance Validation)
   │
   ├─ TSYS Processor
   │
   └─ Mastercard Network

⸻

Features Implemented

Day 1–2

* Express server setup
* REST API creation
* /pay endpoint

Day 3

* Transaction processor
* Routing engine
* Internal vs external routing

Day 4

* Async queue
* Worker processing
* Background transaction handling

Day 5

* Transaction store
* /status/:id endpoint
* Transaction lifecycle tracking

Day 6

* Retry logic
* Failure handling
* Retry counts

Day 7

* Dead Letter Queue (DLQ)
* Failed transaction isolation
* /dead-letter endpoint

Day 8

* Validation layer
* Business rules
* Bad request rejection

Day 9

* Structured logging
* Observability concepts
* Transaction tracing

Day 10

* Deterministic routing
* Internal banking systems
* TSYS processor simulation
* Mastercard network simulation

⸻

Tech Stack

* Node.js
* Express.js
* JavaScript
* Git
* GitHub

⸻

Folder Structure

payment-sim/
│
├── app.js
├── package.json
├── .gitignore
│
├── broker/
│   └── router.js
│
├── logger/
│   └── logger.js
│
├── processor/
│   └── processor.js
│
├── queue/
│   └── queue.js
│
├── store/
│   └── store.js
│
├── systems/
│   ├── internal.js
│   ├── external.js
│   ├── systemA.js
│   └── systemB.js
│
└── validation/
    └── validator.js

⸻

API Endpoints

Health Check

GET /

Response:

Server is alive

⸻

Submit Payment Transaction

POST /pay

Example Request:

{
  "amount": 100,
  "bank": "MY_BANK",
  "cardNumber": "411111",
  "pin": "1234",
  "issuerType": "INTERNAL"
}

Example External TSYS Request:

{
  "amount": 100,
  "bank": "OTHER_BANK",
  "cardNumber": "411111",
  "issuerType": "EXTERNAL",
  "network": "TSYS"
}

Example Mastercard Request:

{
  "amount": 100,
  "bank": "OTHER_BANK",
  "cardNumber": "511111",
  "issuerType": "EXTERNAL",
  "network": "MASTERCARD"
}

Response:

{
  "status": "ACCEPTED",
  "transactionId": "uuid-value"
}

⸻

Check Transaction Status

GET /status/:id

Example Response:

{
  "id": "uuid-value",
  "status": "COMPLETED",
  "route": "EXTERNAL",
  "result": {
    "status": "SUCCESS",
    "system": "TSYS"
  }
}

⸻

View Dead Letter Queue

GET /dead-letter

Example Response:

{
  "count": 1,
  "transactions": [
    {
      "status": "FAILED",
      "retryCount": 3
    }
  ]
}

⸻

Internal System Flow

Internal issuer transactions go through:

Processor
 ↓
System A → PIN Validation
 ↓
System B → Balance Validation
 ↓
Approval

⸻

Retry + DLQ Flow

Failure
 ↓
Retry 1
 ↓
Retry 2
 ↓
Retry 3
 ↓
Dead Letter Queue

⸻

Structured Logging Example

{
  "timestamp": "2026-05-08T11:57:37.333Z",
  "service": "worker",
  "event": "TRANSACTION_RETRYING",
  "transactionId": "txn-id",
  "details": {
    "retryCount": 1,
    "reason": "Simulated processor failure"
  }
}

⸻

How To Run

Install dependencies

npm install

Start application

node app.js

Server runs on:

http://localhost:3000

⸻

Example CURL Commands

Internal Transaction

curl -X POST http://localhost:3000/pay \
-H "Content-Type: application/json" \
-d '{"amount":100,"bank":"MY_BANK","cardNumber":"411111","pin":"1234","issuerType":"INTERNAL"}'

⸻

TSYS Transaction

curl -X POST http://localhost:3000/pay \
-H "Content-Type: application/json" \
-d '{"amount":100,"bank":"OTHER_BANK","cardNumber":"411111","issuerType":"EXTERNAL","network":"TSYS"}'

⸻

Mastercard Transaction

curl -X POST http://localhost:3000/pay \
-H "Content-Type: application/json" \
-d '{"amount":100,"bank":"OTHER_BANK","cardNumber":"511111","issuerType":"EXTERNAL","network":"MASTERCARD"}'

⸻

Future Enhancements

Planned future enhancements include:

* MongoDB/PostgreSQL persistence
* Redis/BullMQ queues
* Docker deployment
* ISO8583 message simulation
* Mainframe integration simulation
* Metrics and monitoring
* Multi-worker concurrency
* Fraud/risk engine
* Config-driven routing

⸻

Learning Outcomes

This project demonstrates practical understanding of:

* Backend API design
* Enterprise payment systems
* Distributed systems concepts
* Queue processing
* Retry patterns
* DLQ architecture
* Observability
* System orchestration
* Mainframe modernization concepts
* Technical program management architecture discussions

⸻

Author

Vis Chandran
