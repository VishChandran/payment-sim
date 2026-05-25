const { Queue } = require("bullmq");

const connection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

const transactionQueue = new Queue("transaction-processing", {
  connection,
});

module.exports = {
  transactionQueue,
  connection,
};