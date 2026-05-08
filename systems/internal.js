function handleInternal(txn) {
  console.log("🏦 Internal system processing");

  return {
    status: "SUCCESS",
    system: "INTERNAL_BANK",
    details: "Processed by System A/B"
  };
}

module.exports = { handleInternal };