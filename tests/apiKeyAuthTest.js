const {
  DEV_ADMIN_API_KEY,
  DEV_API_KEY,
  getConfiguredAdminApiKeys,
  getConfiguredApiKeys,
  isValidAdminApiKey,
  isValidApiKey,
  validateAdminApiKeyConfiguration,
  validateApiKeyConfiguration,
} = require("../middleware/apiKeyAuth");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testMissingProductionApiKeyFailsStartup() {
  let threw = false;

  try {
    validateApiKeyConfiguration({ NODE_ENV: "production" });
  } catch (error) {
    threw = true;
    assert(
      error.message.includes("API_KEY or API_KEYS must be set"),
      "expected clear missing production API key error"
    );
  }

  assert(threw, "expected production config validation to throw without API keys");
  console.log("PASS missing production API key fails startup validation");
}

function testValidApiKeySucceeds() {
  const keys = getConfiguredApiKeys({
    NODE_ENV: "production",
    API_KEYS: "primary-key, rotated-key",
  });

  assert(isValidApiKey("primary-key", keys), "expected primary key to be valid");
  assert(isValidApiKey("rotated-key", keys), "expected rotated key to be valid");
  console.log("PASS valid API key succeeds");
}

function testInvalidApiKeyFails() {
  const keys = getConfiguredApiKeys({
    NODE_ENV: "production",
    API_KEYS: "primary-key, rotated-key",
  });

  assert(!isValidApiKey("wrong-key", keys), "expected wrong key to fail");
  assert(!isValidApiKey("", keys), "expected empty key to fail");
  assert(!isValidApiKey(undefined, keys), "expected missing key to fail");
  console.log("PASS invalid API key fails");
}

function testDevelopmentFallbackWarningKey() {
  const keys = getConfiguredApiKeys({ NODE_ENV: "development" });

  assert(keys.length === 1, "expected one development fallback key");
  assert(keys[0] === DEV_API_KEY, "expected development fallback key");
  console.log("PASS development fallback key remains usable");
}

function testMissingProductionAdminApiKeyFailsStartup() {
  let threw = false;

  try {
    validateAdminApiKeyConfiguration({
      NODE_ENV: "production",
      ADMIN_ENDPOINTS_ENABLED: "true",
    });
  } catch (error) {
    threw = true;
    assert(
      error.message.includes("ADMIN_API_KEY or ADMIN_API_KEYS must be set"),
      "expected clear missing production admin API key error"
    );
  }

  assert(threw, "expected production admin config validation to throw without admin API keys");
  console.log("PASS missing production admin API key fails startup validation");
}

function testValidAdminApiKeySucceeds() {
  const keys = getConfiguredAdminApiKeys({
    NODE_ENV: "production",
    ADMIN_API_KEYS: "admin-primary, admin-rotated",
  });

  assert(isValidAdminApiKey("admin-primary", keys), "expected primary admin key to be valid");
  assert(isValidAdminApiKey("admin-rotated", keys), "expected rotated admin key to be valid");
  console.log("PASS valid admin API key succeeds");
}

function testInvalidAdminApiKeyFails() {
  const keys = getConfiguredAdminApiKeys({
    NODE_ENV: "production",
    ADMIN_API_KEYS: "admin-primary, admin-rotated",
  });

  assert(!isValidAdminApiKey("wrong-admin-key", keys), "expected wrong admin key to fail");
  assert(!isValidAdminApiKey("", keys), "expected empty admin key to fail");
  assert(!isValidAdminApiKey(undefined, keys), "expected missing admin key to fail");
  console.log("PASS invalid admin API key fails");
}

function testDevelopmentAdminFallbackWarningKey() {
  const keys = getConfiguredAdminApiKeys({ NODE_ENV: "development" });

  assert(keys.length === 1, "expected one development admin fallback key");
  assert(keys[0] === DEV_ADMIN_API_KEY, "expected development admin fallback key");
  console.log("PASS development admin fallback key remains usable");
}

function main() {
  testMissingProductionApiKeyFailsStartup();
  testValidApiKeySucceeds();
  testInvalidApiKeyFails();
  testDevelopmentFallbackWarningKey();
  testMissingProductionAdminApiKeyFailsStartup();
  testValidAdminApiKeySucceeds();
  testInvalidAdminApiKeyFails();
  testDevelopmentAdminFallbackWarningKey();
}

try {
  main();
} catch (error) {
  console.error("FAIL", error.message);
  process.exit(1);
}
