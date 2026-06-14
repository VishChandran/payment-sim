const crypto = require("crypto");

const DEV_API_KEY = "dev-api-key";
const DEV_ADMIN_API_KEY = "dev-admin-api-key";

function parseApiKeys(env = process.env) {
  return parseKeys(["API_KEYS", "API_KEY"], env);
}

function parseAdminApiKeys(env = process.env) {
  return parseKeys(["ADMIN_API_KEYS", "ADMIN_API_KEY"], env);
}

function parseKeys(names, env = process.env) {
  const keys = [];

  if (env[names[0]]) {
    keys.push(
      ...env[names[0]]
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean)
    );
  }

  if (env[names[1]]) {
    keys.push(env[names[1]].trim());
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

function getConfiguredAdminApiKeys(env = process.env) {
  const configuredKeys = parseAdminApiKeys(env);

  if (configuredKeys.length > 0) {
    return configuredKeys;
  }

  if (env.NODE_ENV === "production") {
    return [];
  }

  console.warn(
    "WARNING: ADMIN_API_KEY/ADMIN_API_KEYS is not set. Using development admin API key. Do not use this in production."
  );
  return [DEV_ADMIN_API_KEY];
}

function validateApiKeyConfiguration(env = process.env) {
  if (env.NODE_ENV === "production" && parseApiKeys(env).length === 0) {
    throw new Error("API_KEY or API_KEYS must be set when NODE_ENV=production");
  }
}

function validateAdminApiKeyConfiguration(env = process.env) {
  const adminEndpointsEnabled = env.ADMIN_ENDPOINTS_ENABLED !== "false";

  if (
    env.NODE_ENV === "production" &&
    adminEndpointsEnabled &&
    parseAdminApiKeys(env).length === 0
  ) {
    throw new Error(
      "ADMIN_API_KEY or ADMIN_API_KEYS must be set when NODE_ENV=production and admin endpoints are enabled"
    );
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

function isValidAdminApiKey(
  providedKey,
  configuredKeys = getConfiguredAdminApiKeys()
) {
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

function adminApiKeyAuth(req, res, next) {
  const providedKey = req.header("x-admin-api-key");

  if (!isValidAdminApiKey(providedKey)) {
    return res.status(401).json({
      status: "REJECTED",
      reason: "Unauthorized admin API request",
    });
  }

  next();
}

module.exports = {
  DEV_ADMIN_API_KEY,
  DEV_API_KEY,
  adminApiKeyAuth,
  apiKeyAuth,
  getConfiguredAdminApiKeys,
  getConfiguredApiKeys,
  isValidAdminApiKey,
  isValidApiKey,
  parseAdminApiKeys,
  parseApiKeys,
  validateAdminApiKeyConfiguration,
  validateApiKeyConfiguration,
};
