const {
  DEV_API_KEY,
  getConfiguredApiKeys,
  isValidApiKey,
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

function main() {
  testMissingProductionApiKeyFailsStartup();
  testValidApiKeySucceeds();
  testInvalidApiKeyFails();
  testDevelopmentFallbackWarningKey();
}

try {
  main();
} catch (error) {
  console.error("FAIL", error.message);
  process.exit(1);
}
