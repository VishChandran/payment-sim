const express = require("express");
const app = express();
const { config } = require("./config/config");
const WORKER_COUNT = config.workerCount;
const { validateTransaction } = require("./validation/validator");
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
  getDeadLetterQueue
} = require("./queue/queue");
const {
  saveTransaction,
  updateTransaction,
  getTransaction
} = require("./store/store");
const crypto = require("crypto");

console.log("APP STARTING...");
app.use(express.json());

/* ROUTES */
app.get("/", (req, res) => {
  res.json({
    status: "UP",
    service: "payment-sim",
    message: "Payment simulator is running"
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
      "external network routing"
    ]
  });
});

app.get("/status/:id", (req, res) => {
  const txnId = req.params.id;

  const txn = getTransaction(txnId);

  if (!txn) {
    return res.status(404).json({
      error: "Transaction not found"
    });
  }

  res.json(txn);
});
app.get("/dead-letter", (req, res) => {
  res.json({
    count: getDeadLetterQueue().length,
    transactions: getDeadLetterQueue()
  });
});
app.post("/pay", (req, res) => {
  const txn = req.body;

  const validation = validateTransaction(txn);

  if (!validation.valid) {
    return res.status(400).json({
      status: "REJECTED",
      reason: validation.reason
    });
  }

  const risk = evaluateRisk(txn);

  if (risk.decision === "REJECT") {
    return res.status(403).json({
      status: "REJECTED",
      reason: risk.reason
    });
  }

  if (risk.decision === "REVIEW") {
    return res.status(202).json({
      status: "MANUAL_REVIEW",
      reason: risk.reason
    });
  }

  const txnId = crypto.randomUUID();

  const fullTxn = {
    id: txnId,
    ...txn,
    status: "ACCEPTED",
    retryCount: 0
  };

  logEvent(
    "api",
    "TRANSACTION_RECEIVED",
    fullTxn.id,
    maskSensitiveData(fullTxn)
  );

  saveTransaction(fullTxn);
  addToQueue(fullTxn);

  res.json({
    status: "ACCEPTED",
    transactionId: txnId
  });
});

/* WORKER (👇 BELOW ROUTES) */
function startWorker(workerId)  {
  
  setInterval(() => {
    const txn = getNextTransaction();

    if (!txn) return;

    logEvent("worker", "PROCESSING_STARTED", txn.id, {
      workerId
    });

    updateTransaction(txn.id, {
      status: "PROCESSING",
      workerId
    });

    const result = processTransaction(txn);

    if (result.status === "DECLINED") {
      updateTransaction(txn.id, {
        status: "DECLINED",
        reason: result.reason,
        workerId
      });

      logEvent("processor", "TRANSACTION_DECLINED", txn.id, {
        reason: result.reason,
        workerId
      });

      return;
    }

    if (result.status === "FAILED") {
      const retryCount = txn.retryCount || 0;

   if (retryCount < config.maxRetries) {
        const retryTxn = {
          ...txn,
          retryCount: retryCount + 1,
          status: "RETRYING"
        };

        updateTransaction(txn.id, {
          status: "RETRYING",
          retryCount: retryTxn.retryCount,
          reason: result.reason,
          workerId
        });

        logEvent("worker", "TRANSACTION_RETRYING", txn.id, {
          retryCount: retryTxn.retryCount,
          reason: result.reason,
          workerId
        });

        addToQueue(retryTxn);
        return;
      }

      const failedTxn = {
        ...txn,
        status: "FAILED",
        reason: result.reason,
        retryCount,
        workerId
      };

      updateTransaction(txn.id, failedTxn);
      addToDeadLetterQueue(failedTxn);

      logEvent("worker", "TRANSACTION_FAILED_PERMANENTLY", txn.id, {
        reason: result.reason,
        retryCount,
        workerId
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

    updateTransaction(txn.id, {
      status: "COMPLETED",
      route,
      result: finalResult,
      workerId
    });

    logEvent("worker", "TRANSACTION_COMPLETED", txn.id, {
      route,
      result: finalResult,
      workerId
    });

  }, 3000);
}
  for (let i = 1; i <= WORKER_COUNT; i++) {
  startWorker(i);
}


/* SERVER START */
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});