function processTransaction(txn) {
  console.log("PROCESSING_TXN:", txn.id);

 if (
  txn.type !== "BALANCE_INQUIRY" &&
  (!txn.amount || txn.amount <= 0)
) {

  return { status: "DECLINED", reason: "Invalid amount" };

}

  if (txn.amount === 999) {
    return { status: "FAILED", reason: "Simulated processor failure" };
  }

  return { status: "APPROVED" };
}

module.exports = { processTransaction };
