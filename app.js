const express = require("express");
const crypto = require("crypto");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

const { config } = require("./config/config");
const { evaluateRisk } = require("./risk/riskEngine");
const { maskSensitiveData } = require("./utils/mask");
const { logEvent } = require("./logger/logger");
const { routeTransaction } = require("./broker/router");
const { processTransaction } = require("./processor/processor");
const { handleInternal } = require("./systems/internal");
const { handleExternal } = require("./systems/external");

const {
  addToQueue,
  getNextTransaction,
  addToDeadLetterQueue,
  getDeadLetterQueue,
} = require("./queue/queue");

const {
  saveTransaction,
  updateTransaction,
  getTransaction,
} = require("./store/store");

const WORKER_COUNT = config.workerCount;

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
    architecture: "async payment processing simulator",
    features: [
      "validation",
      "risk engine",
      "queue",
      "multi-worker processing",
      "retry logic",
      "dead letter queue",
      "structured logging",
      "internal systems",
      "external network routing",
    ],
  });
});

app.get("/status/:id", (req, res) => {
  const txnId = req.params.id;

  const txn = getTransaction(txnId);

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

app.post("/pay", (req, res) => {
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

    saveTransaction(fullTxn);
    addToQueue(fullTxn);

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

/* WORKER */

function startWorker(workerId) {
  setInterval(() => {
    const txn = getNextTransaction();

    if (!txn) return;

    logEvent("worker", "PROCESSING_STARTED", txn.id, {
      workerId,
    });

    updateTransaction(txn.id, {
  status: "PROCESSING",
  workerId,
  updatedAt: new Date().toISOString(),
  processingTimeline: [
    ...(txn.processingTimeline || []),
    {
      status: "PROCESSING",
      timestamp: new Date().toISOString(),
      message: `Worker ${workerId} started processing`,
    },
  ],
});

    const result = processTransaction(txn);

    if (result.status === "DECLINED") {
      updateTransaction(txn.id, {
  status: "DECLINED",
  reason: result.reason,
  workerId,
  updatedAt: new Date().toISOString(),
  processingTimeline: [
    ...(txn.processingTimeline || []),
    {
      status: "DECLINED",
      timestamp: new Date().toISOString(),
      message: result.reason,
    },
  ],
});

      logEvent("processor", "TRANSACTION_DECLINED", txn.id, {
        reason: result.reason,
        workerId,
      });

      return;
    }

    if (result.status === "FAILED") {
      const retryCount = txn.retryCount || 0;

      if (retryCount < config.maxRetries) {
        const retryTxn = {
          ...txn,
          retryCount: retryCount + 1,
          status: "RETRYING",
        };

        updateTransaction(txn.id, {
          status: "RETRYING",
          retryCount: retryTxn.retryCount,
          reason: result.reason,
          workerId,
        });

        logEvent("worker", "TRANSACTION_RETRYING", txn.id, {
          retryCount: retryTxn.retryCount,
          reason: result.reason,
          workerId,
        });

        addToQueue(retryTxn);
        return;
      }

      const failedTxn = {
        ...txn,
        status: "FAILED",
        reason: result.reason,
        retryCount,
        workerId,
      };

      updateTransaction(txn.id, failedTxn);
      addToDeadLetterQueue(failedTxn);

      logEvent("worker", "TRANSACTION_FAILED_PERMANENTLY", txn.id, {
        reason: result.reason,
        retryCount,
        workerId,
      });

      return;
    }

    const route = routeTransaction(txn);

    let finalResult;

    if (route === "INTERNAL") {
      finalResult = handleInternal(txn);
    } else {
      finalResult = handleExternal(txn);
    }

    if (finalResult.status === "DECLINED") {
      updateTransaction(txn.id, {
        status: "DECLINED",
        route,
        reason: finalResult.reason,
        workerId,
      });

      logEvent("worker", "TRANSACTION_DECLINED", txn.id, {
        route,
        reason: finalResult.reason,
        workerId,
      });

      return;
    }

  updateTransaction(txn.id, {
  status: "COMPLETED",
  route,
  result: finalResult,
  workerId,
  updatedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  processingTimeline: [
    ...(txn.processingTimeline || []),
    {
      status: "PROCESSING",
      timestamp: new Date().toISOString(),
      message: `Worker ${workerId} processed transaction`,
    },
    {
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      message: "Transaction processed successfully",
    },
  ],
});

    logEvent("worker", "TRANSACTION_COMPLETED", txn.id, {
      route,
      result: finalResult,
      workerId,
    });
  }, 3000);
}

for (let i = 1; i <= WORKER_COUNT; i++) {
  startWorker(i);
}

/* SERVER START */
console.log("PORT FROM ENV:", process.env.PORT);
console.log("CONFIG PORT:", config.port);
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});