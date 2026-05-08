const { config } = require("../config/config");
function validateBalance(txn) {
  console.log("💰 System B - Checking balance");

  if (txn.transactionType === "BALANCE_INQUIRY") {
    return {
      status: "SUCCESS",
      system: "BALANCE_SYSTEM",
      balance: config.balances.inquiryBalance
    };
  }

  if (txn.transactionType === "REVERSAL") {
    return {
      status: "SUCCESS",
      system: "REVERSAL_SYSTEM",
      details: "Previous transaction reversed"
    };
  }

  if (txn.amount > config.balances.defaultBalance) {
    return {
      status: "DECLINED",
      reason: "Insufficient funds"
    };
  }

  return {
    status: "APPROVED"
  };
}

module.exports = { validateBalance };