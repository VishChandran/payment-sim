function validatePIN(txn) {
  console.log("🔐 System A - Validating PIN");

  if (txn.pinVerified !== true) {
    return {
      status: "DECLINED",
      reason: "Invalid PIN"
    };
  }

  return {
    status: "APPROVED"
  };
}

module.exports = { validatePIN };
