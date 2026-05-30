function routeTransaction(txn) {
  console.log("BROKER_RECEIVED_TXN");

  if (txn.issuerType === "INTERNAL") {
    return "INTERNAL";
  }

 if (txn.network === "EXTERNAL_PROCESSOR") {
  return "EXTERNAL_PROCESSOR";
}

if (txn.network === "CARD_NETWORK") {
  return "CARD_NETWORK";
}
  

  if (txn.issuerType === "EXTERNAL") {
    return "EXTERNAL";
  }

  return "UNKNOWN";
}

module.exports = { routeTransaction };