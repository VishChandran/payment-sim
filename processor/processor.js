function processTransaction(txn) {
  console.log("⚙️ Processing txn:", txn.id);

 if (
  txn.transactionType !== "BALANCE_INQUIRY" &&
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