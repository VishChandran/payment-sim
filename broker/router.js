function routeTransaction(txn) {
  console.log("📡 Broker received txn");

  if (txn.issuerType === "INTERNAL") {
    return "INTERNAL";
  }

  if (txn.issuerType === "EXTERNAL") {
    return "EXTERNAL";
  }

  return "UNKNOWN";
}

module.exports = { routeTransaction };