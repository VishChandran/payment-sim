const transactions = {};

function saveTransaction(txn) {
  transactions[txn.id] = txn;
}

function updateTransaction(id, updates) {
  if (!transactions[id]) return;

  transactions[id] = {
    ...transactions[id],
    ...updates
  };
}

function getTransaction(id) {
  return transactions[id];
}

module.exports = {
  saveTransaction,
  updateTransaction,
  getTransaction
};