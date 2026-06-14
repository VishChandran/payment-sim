const crypto = require("crypto");

const DEV_API_KEY = "dev-api-key";
const DEV_ADMIN_API_KEY = "dev-admin-api-key";

function parseApiKeys(env = process.env) {
  return parseApiCredentials(env).map((credential) => credential.key);
}

function parseAdminApiKeys(env = process.env) {
  return parseKeys(["ADMIN_API_KEYS", "ADMIN_API_KEY"], env);
}

function parseApiCredentials(env = process.env) {
  const defaultClientId = env.API_CLIENT_ID || env.CLIENT_ID || "default-client";
  const keys = parseKeys(["API_KEYS", "API_KEY"], env);

  return keys.map((entry) => {
    const separatorIndex = entry.indexOf(":");

    if (separatorIndex === -1) {
      return {
        clientId: defaultClientId,
        key: entry,
      };
    }

    return {
      clientId: entry.slice(0, separatorIndex).trim() || defaultClientId,
      key: entry.slice(separatorIndex + 1).trim(),
    };
  }).filter((credential) => credential.key);
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
  return getConfiguredApiCredentials(env).map((credential) => credential.key);
}

function getConfiguredApiCredentials(env = process.env) {
  const configuredCredentials = parseApiCredentials(env);

  if (configuredCredentials.length > 0) {
    return configuredCredentials;
  }

  if (env.NODE_ENV === "production") {
    return [];
  }

  console.warn(
    "WARNING: API_KEY/API_KEYS is not set. Using development API key. Do not use this in production."
  );
  return [
    {
      clientId: "development-client",
      key: DEV_API_KEY,
    },
  ];
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

function authenticateApiKey(
  providedKey,
  configuredCredentials = getConfiguredApiCredentials()
) {
  if (!providedKey) {
    return null;
  }

  return (
    configuredCredentials.find((credential) =>
      constantTimeEquals(providedKey, credential.key)
    ) || null
  );
}

function isValidApiKey(providedKey, configuredKeys = getConfiguredApiKeys()) {
  const credentials = configuredKeys.map((key) => ({
    clientId: "unknown",
    key,
  }));

  return Boolean(authenticateApiKey(providedKey, credentials));
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
  const credential = authenticateApiKey(providedKey);

  if (!credential) {
    return res.status(401).json({
      status: "REJECTED",
      reason: "Unauthorized API request",
    });
  }

  req.auth = {
    type: "client",
    clientId: credential.clientId,
  };

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

function apiKeyOrAdminAuth(req, res, next) {
  const providedAdminKey = req.header("x-admin-api-key");

  if (providedAdminKey && isValidAdminApiKey(providedAdminKey)) {
    req.auth = {
      type: "admin",
    };
    return next();
  }

  return apiKeyAuth(req, res, next);
}

module.exports = {
  DEV_ADMIN_API_KEY,
  DEV_API_KEY,
  adminApiKeyAuth,
  apiKeyOrAdminAuth,
  apiKeyAuth,
  authenticateApiKey,
  getConfiguredApiCredentials,
  getConfiguredAdminApiKeys,
  getConfiguredApiKeys,
  isValidAdminApiKey,
  isValidApiKey,
  parseApiCredentials,
  parseAdminApiKeys,
  parseApiKeys,
  validateAdminApiKeyConfiguration,
  validateApiKeyConfiguration,
};
