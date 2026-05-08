function routeTransaction(txn) {
  console.log("📡 Broker received txn");

  if (txn.bank === "MY_BANK") {
    return "INTERNAL";
  } else {
    return "EXTERNAL";
  }
}

module.exports = { routeTransaction };