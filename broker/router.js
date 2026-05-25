function routeTransaction(txn) {
  console.log("📡 Broker received txn");

  if (txn.issuerType === "INTERNAL") {
    return "INTERNAL";
  }

  if (txn.network === "TSYS") {
    return "TSYS";
  }

  if (txn.network === "MASTERCARD") {
    return "MASTERCARD";
  }

  if (txn.issuerType === "EXTERNAL") {
    return "EXTERNAL";
  }

  return "UNKNOWN";
}

module.exports = { routeTransaction };