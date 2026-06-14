const crypto = require("crypto");
const { logEvent } = require("../logger/logger");
const { routeTransaction } = require("../broker/router");
const { processTransaction } = require("../processor/processor");
const { handleInternal } = require("../systems/internal");
const { handleExternal } = require("../systems/external");
const { sanitizePayload } = require("../utils/sensitiveData");
const {
  finalizeTransactionProcessing,
  getTransaction,
  startTransactionProcessing,
} = require("../store/store");

const FINAL_STATUSES = new Set(["COMPLETED", "DECLINED", "FAILED"]);

async function handleTransactionJob(job, processorInstanceId) {
  const txn = sanitizePayload(job.data);
  const workerId = processorInstanceId || `worker-${crypto.randomUUID()}`;

  const existingTxn = await getTransaction(txn.id);

  if (!existingTxn) {
    throw new Error(`Transaction not found: ${txn.id}`);
  }

  if (FINAL_STATUSES.has(existingTxn.status)) {
    logEvent("worker", "DUPLICATE_JOB_IGNORED", txn.id, {
      workerId,
      jobId: job.id,
      status: existingTxn.status,
    });
    return { skipped: true, reason: "Transaction already finalized" };
  }

  if (existingTxn.status !== "ACCEPTED") {
    logEvent("worker", "DUPLICATE_JOB_IGNORED", txn.id, {
      workerId,
      jobId: job.id,
      status: existingTxn.status,
    });
    return { skipped: true, reason: `Transaction is ${existingTxn.status}` };
  }

  const processingTimeline = [
    ...(existingTxn.processing_timeline || txn.processingTimeline || []),
    {
      status: "PROCESSING",
      timestamp: new Date().toISOString(),
      message: "BullMQ worker started processing",
    },
  ];

  const processingTxn = await startTransactionProcessing(
    txn.id,
    workerId,
    processingTimeline
  );

  if (!processingTxn) {
    const latestTxn = await getTransaction(txn.id);
    logEvent("worker", "DUPLICATE_JOB_IGNORED", txn.id, {
      workerId,
      jobId: job.id,
      status: latestTxn ? latestTxn.status : "UNKNOWN",
    });
    return { skipped: true, reason: "Transaction claim lost" };
  }

  logEvent("worker", "PROCESSING_STARTED", txn.id, {
    workerId,
    jobId: job.id,
  });

  const result = processTransaction(txn);

  if (result.status === "FAILED") {
    throw new Error(result.reason || "Transaction processor failed");
  }

  if (result.status === "DECLINED") {
    const finalizedTxn = await finalizeTransactionProcessing(txn.id, workerId, {
      status: "DECLINED",
      reason: result.reason,
      workerId: 1,
    });

    if (!finalizedTxn) {
      return { skipped: true, reason: "Transaction finalization lost" };
    }

    return { skipped: false, status: "DECLINED" };
  }

  const route = routeTransaction(txn);

  let finalResult;

  if (route === "INTERNAL") {
    finalResult = handleInternal(txn);
  } else if (route === "EXTERNAL_PROCESSOR" || route === "CARD_NETWORK") {
    finalResult = handleExternal(txn);
  } else {
    finalResult = {
      status: "DECLINED",
      reason: "Unsupported route",
    };
  }

  if (finalResult.status === "DECLINED") {
    const finalizedTxn = await finalizeTransactionProcessing(txn.id, workerId, {
      status: "DECLINED",
      route,
      reason: finalResult.reason,
      workerId: 1,
    });

    if (!finalizedTxn) {
      return { skipped: true, reason: "Transaction finalization lost" };
    }

    return { skipped: false, status: "DECLINED" };
  }

  const finalizedTxn = await finalizeTransactionProcessing(txn.id, workerId, {
    status: "COMPLETED",
    route,
    result: finalResult,
    workerId: 1,
    processingTimeline: [
      ...processingTimeline,
      {
        status: "PROCESSING",
        timestamp: new Date().toISOString(),
        message: "BullMQ worker processed transaction",
      },
      {
        status: "COMPLETED",
        timestamp: new Date().toISOString(),
        message: "Transaction processed successfully",
      },
    ],
  });

  if (!finalizedTxn) {
    return { skipped: true, reason: "Transaction finalization lost" };
  }

  return { skipped: false, status: "COMPLETED" };
}

module.exports = { FINAL_STATUSES, handleTransactionJob };
