const { config } = require("../config/config");

function validateTransaction(txn) {
  const requiredFields = ["amount", "fromAccount", "toAccount", "type", "channel", "issuerType"];
  const missingFields = requiredFields.filter(
    (field) => txn[field] === undefined || txn[field] === null || txn[field] === ""
  );

  if (missingFields.length > 0) {
    return {
      valid: false,
      reason: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }

  if (!Number.isFinite(Number(txn.amount))) {
    return { valid: false, reason: "Amount must be a number" };
  }

  const amount = Number(txn.amount);

  if (txn.type !== "BALANCE_INQUIRY" && amount <= 0) {
    return { valid: false, reason: "Amount must be greater than 0" };
  }

  if (amount > config.transactionLimit) {
    return { valid: false, reason: "Amount exceeds transaction limit" };
  }

  if (!config.supportedTransactionTypes.includes(txn.type)) {
    return { valid: false, reason: "Invalid transaction type" };
  }

  if (!config.supportedIssuerTypes.includes(txn.issuerType)) {
    return { valid: false, reason: "Issuer type must be INTERNAL or EXTERNAL" };
  }

  if (!config.supportedChannels.includes(txn.channel)) {
    return { valid: false, reason: "Invalid channel" };
  }

  if (txn.issuerType === "EXTERNAL" && !txn.network) {
    return { valid: false, reason: "Network is required for external issuer" };
  }

  if (txn.network && !config.supportedNetworks.includes(txn.network)) {
    return { valid: false, reason: "Network must be EXTERNAL_PROCESSOR or CARD_NETWORK" };
  }

  if (txn.cardNumber && String(txn.cardNumber).length < 4) {
    return { valid: false, reason: "Card number is too short" };
  }

  return {
    valid: true,
    transaction: {
      ...txn,
      amount,
      type: txn.type,
    },
  };
}

module.exports = { validateTransaction };
