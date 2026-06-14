const crypto = require("crypto");

const DEV_API_KEY = "dev-api-key";

function parseApiKeys(env = process.env) {
  const keys = [];

  if (env.API_KEYS) {
    keys.push(
      ...env.API_KEYS.split(",")
        .map((key) => key.trim())
        .filter(Boolean)
    );
  }

  if (env.API_KEY) {
    keys.push(env.API_KEY.trim());
  }

  return [...new Set(keys.filter(Boolean))];
}

function getConfiguredApiKeys(env = process.env) {
  const configuredKeys = parseApiKeys(env);

  if (configuredKeys.length > 0) {
    return configuredKeys;
  }

  if (env.NODE_ENV === "production") {
    return [];
  }

  console.warn(
    "WARNING: API_KEY/API_KEYS is not set. Using development API key. Do not use this in production."
  );
  return [DEV_API_KEY];
}

function validateApiKeyConfiguration(env = process.env) {
  if (env.NODE_ENV === "production" && parseApiKeys(env).length === 0) {
    throw new Error("API_KEY or API_KEYS must be set when NODE_ENV=production");
  }
}

function constantTimeEquals(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function isValidApiKey(providedKey, configuredKeys = getConfiguredApiKeys()) {
  if (!providedKey) {
    return false;
  }

  return configuredKeys.some((configuredKey) =>
    constantTimeEquals(providedKey, configuredKey)
  );
}

function apiKeyAuth(req, res, next) {
  const providedKey = req.header("x-api-key");

  if (!isValidApiKey(providedKey)) {
    return res.status(401).json({
      status: "REJECTED",
      reason: "Unauthorized API request",
    });
  }

  next();
}

module.exports = {
  DEV_API_KEY,
  apiKeyAuth,
  getConfiguredApiKeys,
  isValidApiKey,
  parseApiKeys,
  validateApiKeyConfiguration,
};
