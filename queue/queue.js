const queue = [];
const deadLetterQueue = [];

function addToQueue(txn) {
  console.log("📥 Adding to queue:", txn.id);
  queue.push(txn);
}

function getNextTransaction() {
  return queue.shift();
}

function addToDeadLetterQueue(txn) {
  console.log("☠️ Moving to DLQ:", txn.id);
  deadLetterQueue.push(txn);
}

function getDeadLetterQueue() {
  return deadLetterQueue;
}

module.exports = {
  addToQueue,
  getNextTransaction,
  addToDeadLetterQueue,
  getDeadLetterQueue
};