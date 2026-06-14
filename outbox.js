const { startOutboxProcessor } = require("./outbox/outboxProcessor");
const { startTransactionRecoveryScheduler } = require("./recovery/transactionRecovery");

startOutboxProcessor();
startTransactionRecoveryScheduler();

console.log("Outbox processor started");
