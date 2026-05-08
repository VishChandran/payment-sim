const { config } = require("../config/config");
function evaluateRisk(txn) {
  if (txn.channel === "INTERNATIONAL_ATM" && txn.amount > config.riskRules.internationalAtmLimit) {
    return {
      decision: "REJECT",
      reason: "High-risk international ATM withdrawal"
    };
  }

  if (txn.channel === "ECOM" && txn.amount > config.riskRules.ecommerceReviewLimit) {
    return {
      decision: "REVIEW",
      reason: "High-value e-commerce transaction"
    };
  }

  if (txn.channel === "INTERNATIONAL_POS" && txn.amount > config.riskRules.internationalPosReviewLimit) {
    return {
      decision: "REVIEW",
      reason: "High-value international POS transaction"
    };
  }

  return {
    decision: "APPROVE"
  };
}

module.exports = { evaluateRisk };