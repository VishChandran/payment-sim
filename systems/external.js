function handleExternal(txn) {
  console.log("🌐 External network (TSYS/Mastercard)");

  return {
    status: "SUCCESS",
    system: "EXTERNAL_NETWORK",
    details: "Processed via TSYS/Mastercard"
  };
}

module.exports = { handleExternal };