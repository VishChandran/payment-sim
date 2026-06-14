const { Worker } = require("bullmq");
const { connection } = require("./transactionQueue");

const { saveDeadLetterJob, updateTransaction } = require("../store/store");
const { handleTransactionJob } = require("./transactionJobHandler");
const { sanitizeText } = require("../utils/sensitiveData");

const worker = new Worker(
  "transaction-processing",
  async (job) => {
    await handleTransactionJob(job, "bullmq-worker");
  },
  {
    connection,
  }
);

worker.on("completed", (job) => {
  console.log(`BULLMQ_JOB_COMPLETED: ${job.id}`);
});

worker.on("failed", async (job, err) => {
  if (!job) {
    console.error("BULLMQ_JOB_FAILED_WITHOUT_JOB:", err.message);
    return;
  }

  console.error(`BULLMQ_JOB_FAILED: ${job.id}`, err.message);

  const maxAttempts = job.opts.attempts || 1;
  const safeReason = sanitizeText(err.message);

  if (job.attemptsMade < maxAttempts) {
    if (job.data && job.data.id) {
      await updateTransaction(job.data.id, {
        status: "ACCEPTED",
        reason: safeReason,
        retryCount: job.attemptsMade,
        clearProcessing: true,
      });
    }

    return;
  }

  try {
    await saveDeadLetterJob(job, err);

    if (job.data && job.data.id) {
      await updateTransaction(job.data.id, {
        status: "FAILED",
        reason: safeReason,
        retryCount: job.attemptsMade,
        clearProcessing: true,
      });
    }

    console.error(`BULLMQ_JOB_DEAD_LETTERED: ${job.id}`);
  } catch (saveError) {
    console.error(`BULLMQ_DLQ_SAVE_FAILED: ${job.id}`, saveError.message);
  }
});

module.exports = worker;
