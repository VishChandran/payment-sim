const { Worker } = require("bullmq");
const { connection } = require("./transactionQueue");

const { config } = require("../config/config");
const { logEvent } = require("../logger/logger");
const { routeTransaction } = require("../broker/router");
const { processTransaction } = require("../processor/processor");
const { handleInternal } = require("../systems/internal");
const { handleExternal } = require("../systems/external");
const { updateTransaction } = require("../store/store");
const { addToDeadLetterQueue } = require("../queue/queue");

const worker = new Worker(
  "transaction-processing",
  async (job) => {
    const txn = job.data;
    const workerId = "bullmq-worker";

    logEvent("worker", "PROCESSING_STARTED", txn.id, {
      workerId,
      jobId: job.id,
    });

    await updateTransaction(txn.id, {
      status: "PROCESSING",
      workerId: 1,
      processingTimeline: [
        ...(txn.processingTimeline || []),
        {
          status: "PROCESSING",
          timestamp: new Date().toISOString(),
          message: "BullMQ worker started processing",
        },
      ],
    });

    const result = processTransaction(txn);

    if (result.status === "DECLINED") {
      await updateTransaction(txn.id, {
        status: "DECLINED",
        reason: result.reason,
        workerId: 1,
      });

      return;
    }

    const route = routeTransaction(txn);

    let finalResult;

  if (route === "INTERNAL") {
  finalResult = handleInternal(txn);
} else if (route === "TSYS" || route === "MASTERCARD" || route === "EXTERNAL") {
  finalResult = handleExternal(txn);
} else {
  finalResult = {
    status: "DECLINED",
    reason: "Unsupported route"
  };
}

    if (finalResult.status === "DECLINED") {
      await updateTransaction(txn.id, {
        status: "DECLINED",
        route,
        reason: finalResult.reason,
        workerId: 1,
      });

      return;
    }

    await updateTransaction(txn.id, {
      status: "COMPLETED",
      route,
      result: finalResult,
      workerId: 1,
      processingTimeline: [
        ...(txn.processingTimeline || []),
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
  },
  {
    connection,
  }
);

worker.on("completed", (job) => {
  console.log(`✅ BullMQ job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ BullMQ job failed: ${job.id}`, err.message);
});

module.exports = worker;