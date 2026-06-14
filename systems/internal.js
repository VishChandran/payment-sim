const { validatePIN } = require("./systemA");
const { validateBalance } = require("./systemB");

function handleInternal(txn) {
  console.log("🏦 Internal system processing");

  // Balance inquiry skips PIN
  if (txn.type === "BALANCE_INQUIRY") {
    return validateBalance(txn);
  }

  const pinResult = validatePIN(txn);

  if (pinResult.status === "DECLINED") {
    return pinResult;
  }

  const balanceResult = validateBalance(txn);

  if (balanceResult.status === "DECLINED") {
    return balanceResult;
  }

  // Special transaction types
  if (txn.type === "REVERSAL") {
    return balanceResult;
  }

  if (txn.type === "CASH_WITHDRAWAL") {
    return {
      status: "SUCCESS",
      system: "ATM_CASH_SYSTEM",
      details: "Cash withdrawal approved"
    };
  }

  return {
    status: "SUCCESS",
    system: "PURCHASE_SYSTEM",
    details: "Purchase approved"
  };
}

module.exports = { handleInternal };
