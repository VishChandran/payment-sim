const { config } = require("../config/config");
function validateTransaction(txn) {
  if (txn.amount === undefined || txn.amount === null) {
  return { valid: false, reason: "Amount is required" };
}
if (txn.transactionType !== "BALANCE_INQUIRY" && txn.amount <= 0) {
  return { valid: false, reason: "Amount must be greater than 0" };
}

  if (!txn.bank) {
    return { valid: false, reason: "Bank is required" };
  }

  if (!txn.cardNumber) {
    return { valid: false, reason: "Card number is required" };
  }

  if (txn.cardNumber.length < 4) {
    return { valid: false, reason: "Card number is too short" };
  }

  if (txn.amount > config.transactionLimit) {
    return { valid: false, reason: "Amount exceeds transaction limit" };
  }

  if (!txn.issuerType) {
  return { valid: false, reason: "Issuer type is required" };
}

if (!config.supportedIssuerTypes.includes(txn.issuerType)) {
  return { valid: false, reason: "Issuer type must be INTERNAL or EXTERNAL" };
}

if (txn.issuerType === "EXTERNAL" && !txn.network) {
  return { valid: false, reason: "Network is required for external issuer" };
}

if (txn.issuerType === "EXTERNAL" && !config.supportedNetworks.includes(txn.network).includes(txn.network)) {
  return { valid: false, reason: "Network must be TSYS or MASTERCARD" };
}
if (!txn.channel) {
  return { valid: false, reason: "Channel is required" };
}

const allowedChannels = [
  "DOMESTIC_ATM",
  "INTERNATIONAL_ATM",
  "DOMESTIC_POS",
  "INTERNATIONAL_POS",
  "ECOM"
];

if (!allowedChannels.includes(txn.channel)) {
  return { valid: false, reason: "Invalid channel" };
}

  return { valid: true };
}

module.exports = { validateTransaction };