const express = require("express");
const crypto = require("crypto");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

const { transactionQueue } = require("./jobs/transactionQueue");
require("./jobs/transactionWorker");

const { config } = require("./config/config");
const { evaluateRisk } = require("./risk/riskEngine");
const { maskSensitiveData } = require("./utils/mask");
const { logEvent } = require("./logger/logger");

const {
  saveTransaction,
  getTransaction,
} = require("./store/store");

const { getDeadLetterQueue } = require("./queue/queue");

console.log("APP STARTING...");

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    status: "REJECTED",
    reason: "Too many requests. Please try again later.",
  },
});

app.use(apiLimiter);

/* ROUTES */

app.get("/", (req, res) => {
  res.json({
    status: "UP",
    service: "payment-sim",
    message: "Payment simulator is running",
  });
});

app.get("/info", (req, res) => {
  res.json({
    service: "payment-sim",
    architecture: "BullMQ-backed async payment processing simulator",
    features: [
      "validation",
      "risk engine",
      "BullMQ queue",
      "Redis-backed worker processing",
      "PostgreSQL transaction lifecycle persistence",
      "retry logic",
      "dead letter queue",
      "structured logging",
      "internal systems",
      "external network routing",
    ],
  });
});

app.get("/status/:id", async (req, res) => {
  const txnId = req.params.id;

  const txn = await getTransaction(txnId);

  if (!txn) {
    return res.status(404).json({
      error: "Transaction not found",
    });
  }

  return res.json(txn);
});

app.get("/dead-letter", (req, res) => {
  res.json({
    count: getDeadLetterQueue().length,
    transactions: getDeadLetterQueue(),
  });
});

app.post("/pay", async (req, res) => {
  try {
    const txn = req.body;

    logEvent("api", "RAW_TRANSACTION_RECEIVED", "N/A", maskSensitiveData(txn));

    if (!txn.amount || !txn.fromAccount || !txn.toAccount || !txn.type) {
      return res.status(400).json({
        status: "DECLINED",
        reason: "Missing required transaction fields",
      });
    }

    if (txn.amount <= 0) {
      return res.status(400).json({
        status: "DECLINED",
        reason: "Amount must be greater than 0",
      });
    }

    const risk = evaluateRisk(txn);

    if (risk.decision === "REJECT") {
      return res.status(403).json({
        status: "REJECTED",
        reason: risk.reason,
      });
    }

    if (risk.decision === "REVIEW") {
      return res.status(202).json({
        status: "MANUAL_REVIEW",
        reason: risk.reason,
      });
    }

    const txnId = crypto.randomUUID();
    const now = new Date().toISOString();

    const fullTxn = {
      id: txnId,
      ...txn,
      status: "ACCEPTED",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      processingTimeline: [
        {
          status: "ACCEPTED",
          timestamp: now,
          message: "Transaction accepted by API",
        },
      ],
    };

    logEvent(
      "api",
      "TRANSACTION_RECEIVED",
      fullTxn.id,
      maskSensitiveData(fullTxn)
    );

    await saveTransaction(fullTxn);

    await transactionQueue.add("process-transaction", fullTxn);

    return res.status(202).json({
      status: "ACCEPTED",
      transactionId: txnId,
      message: "Transaction accepted for processing",
    });
  } catch (error) {
    console.error("❌ Error accepting payment:", error);

    return res.status(500).json({
      status: "ERROR",
      reason: "Internal server error",
    });
  }
});

/* SERVER START */

console.log("PORT FROM ENV:", process.env.PORT);
console.log("CONFIG PORT:", config.port);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});