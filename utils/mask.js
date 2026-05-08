function maskSensitiveData(txn) {
  return {
    ...txn,

    cardNumber: txn.cardNumber
      ? "****" + txn.cardNumber.slice(-4)
      : undefined,

    pin: txn.pin
      ? "****"
      : undefined
  };
}

module.exports = { maskSensitiveData };