const express = require("express");
const app = express();
const { validateTransaction } = require("./validation/validator");
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
  const txnId = crypto.randomUUID();

  const fullTxn = {
    id: txnId,
    ...txn,
    status: "ACCEPTED",
    retryCount: 0
  };

  // Save transaction in store
logEvent("api", "TRANSACTION_RECEIVED", fullTxn.id, {
  amount: fullTxn.amount,
  bank: fullTxn.bank
});
saveTransaction(fullTxn);
addToQueue(fullTxn);

  res.json({
    status: "ACCEPTED",
    transactionId: txnId
  });
});

/* WORKER (👇 BELOW ROUTES) */
setInterval(() => {
  const txn = getNextTransaction();

  if (!txn) return;

  logEvent("worker", "PROCESSING_STARTED", txn.id);

  updateTransaction(txn.id, {
    status: "PROCESSING"
  });

  const result = processTransaction(txn);

  if (result.status === "DECLINED") {
  updateTransaction(txn.id, {
    status: "DECLINED",
    reason: result.reason
  });

  logEvent("processor", "TRANSACTION_DECLINED", txn.id, {
  reason: result.reason
});
  return;
}

if (result.status === "FAILED") {
  const retryCount = txn.retryCount || 0;

  if (retryCount < 3) {
    const retryTxn = {
      ...txn,
      retryCount: retryCount + 1,
      status: "RETRYING"
    };

    updateTransaction(txn.id, {
      status: "RETRYING",
      retryCount: retryTxn.retryCount,
      reason: result.reason
    });

   logEvent("worker", "TRANSACTION_RETRYING", txn.id, {
  retryCount: retryTxn.retryCount,
  reason: result.reason
});

addToQueue(retryTxn);
return;
  }

 const failedTxn = {
  ...txn,
  status: "FAILED",
  reason: result.reason,
  retryCount
};
updateTransaction(txn.id, failedTxn);
addToDeadLetterQueue(failedTxn);
logEvent("worker", "TRANSACTION_FAILED_PERMANENTLY", txn.id, {
  reason: result.reason,
  retryCount
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
    result: finalResult
  });

  logEvent("worker", "TRANSACTION_COMPLETED", txn.id, {
  route,
  result: finalResult
});
}, 3000);

/* SERVER START */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});