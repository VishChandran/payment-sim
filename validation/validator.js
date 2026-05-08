function validateTransaction(txn) {
  if (!txn.amount) {
    return { valid: false, reason: "Amount is required" };
  }

  if (txn.amount <= 0) {
    return { valid: false, reason: "Amount must be greater than 0" };
  }

  if (!txn.bank) {
    return { valid: false, reason: "Bank is required" };
  }

  if (!txn.cardNumber) {
    return { valid: false, reason: "Card number is required" };
  }

  if (txn.cardNumber.length < 4) {
    return { valid: false, reason: "Card number is too short" };
  }

  if (txn.amount > 10000) {
    return { valid: false, reason: "Amount exceeds transaction limit" };
  }

  return { valid: true };
}

module.exports = { validateTransaction };