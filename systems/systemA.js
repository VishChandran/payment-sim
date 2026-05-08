function validatePIN(txn) {
  console.log("🔐 System A - Validating PIN");

  if (txn.pin !== "1234") {
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