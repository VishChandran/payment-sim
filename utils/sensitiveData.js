const crypto = require("crypto");

const DEV_CARD_FINGERPRINT_SECRET = "dev-card-fingerprint-secret";

function getCardFingerprintSecret(env = process.env) {
  if (env.CARD_FINGERPRINT_SECRET) {
    return env.CARD_FINGERPRINT_SECRET;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("CARD_FINGERPRINT_SECRET must be set when NODE_ENV=production");
  }

  console.warn(
    "WARNING: CARD_FINGERPRINT_SECRET is not set. Using development card fingerprint secret. Do not use this in production."
  );
  return DEV_CARD_FINGERPRINT_SECRET;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function cardLast4(cardNumber) {
  const digits = onlyDigits(cardNumber);
  return digits ? digits.slice(-4) : null;
}

function cardFingerprint(cardNumber, env = process.env) {
  const digits = onlyDigits(cardNumber);

  if (!digits) {
    return null;
  }

  return crypto
    .createHmac("sha256", getCardFingerprintSecret(env))
    .update(digits)
    .digest("hex");
}

function removeSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(removeSensitiveFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (key === "pin" || key === "cardNumber" || key === "card_number") {
      continue;
    }

    sanitized[key] = removeSensitiveFields(childValue);
  }

  return sanitized;
}

function sanitizeTransactionForPersistence(txn, env = process.env) {
  const sanitized = removeSensitiveFields(txn);
  const cardNumber = txn.cardNumber || txn.card_number;
  const last4 = cardLast4(cardNumber);
  const fingerprint = cardFingerprint(cardNumber, env);

  if (last4) {
    sanitized.cardLast4 = last4;
    sanitized.card_last4 = last4;
  }

  if (fingerprint) {
    sanitized.cardFingerprint = fingerprint;
    sanitized.card_fingerprint = fingerprint;
  }

  return sanitized;
}

function sanitizePayload(value, env = process.env) {
  if (value && typeof value === "object") {
    return sanitizeTransactionForPersistence(value, env);
  }

  return removeSensitiveFields(value);
}

function serializeTransactionResponse(txn) {
  const response = removeSensitiveFields(txn);
  delete response.cardFingerprint;
  delete response.card_fingerprint;
  return response;
}

function sanitizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  let sanitized = String(value);
  sanitized = sanitized.replace(/\b\d{12,19}\b/g, "[REDACTED_CARD]");
  sanitized = sanitized.replace(/["']?pin["']?\s*:\s*["']?[^"',}\s]+["']?/gi, "[REDACTED_PIN]");
  sanitized = sanitized.replace(/["']?cardNumber["']?\s*:\s*["']?[^"',}\s]+["']?/gi, "[REDACTED_CARD]");
  sanitized = sanitized.replace(/["']?card_number["']?\s*:\s*["']?[^"',}\s]+["']?/gi, "[REDACTED_CARD]");
  sanitized = sanitized.replace(/\bpin\s*[:=]\s*\S+/gi, "[REDACTED_PIN]");
  sanitized = sanitized.replace(/\bcardNumber\s*[:=]\s*\S+/gi, "[REDACTED_CARD]");
  sanitized = sanitized.replace(/\bcard_number\s*[:=]\s*\S+/gi, "[REDACTED_CARD]");
  return sanitized;
}

function maskSensitiveData(value) {
  const sanitized = removeSensitiveFields(value);
  const last4 = cardLast4(value && (value.cardNumber || value.card_number));
  delete sanitized.cardFingerprint;
  delete sanitized.card_fingerprint;

  if (last4) {
    sanitized.cardLast4 = last4;
    sanitized.cardNumber = `****${last4}`;
  }

  return sanitized;
}

module.exports = {
  cardFingerprint,
  cardLast4,
  maskSensitiveData,
  removeSensitiveFields,
  sanitizePayload,
  sanitizeText,
  sanitizeTransactionForPersistence,
  serializeTransactionResponse,
};
