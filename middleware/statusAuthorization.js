function canAccessTransactionStatus(auth, transaction) {
  if (!auth || !transaction) {
    return false;
  }

  if (auth.type === "admin") {
    return true;
  }

  return auth.type === "client" && transaction.client_id === auth.clientId;
}

module.exports = { canAccessTransactionStatus };
