const {
  buildCorsOptions,
  isOriginAllowed,
  parseAllowedOrigins,
} = require("../middleware/corsConfig");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runCorsOriginCheck(origin, env) {
  return new Promise((resolve) => {
    buildCorsOptions(env).origin(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
}

async function testAllowedOrigin() {
  const env = {
    NODE_ENV: "production",
    ALLOWED_ORIGINS: "https://merchant.example, https://admin.example",
  };

  assert(
    parseAllowedOrigins(env).length === 2,
    "expected two allowed origins to be parsed"
  );
  assert(
    isOriginAllowed("https://merchant.example", env),
    "expected configured production origin to be allowed"
  );

  const result = await runCorsOriginCheck("https://merchant.example", env);
  assert(!result.error, "expected allowed origin to return no error");
  assert(result.allowed === true, "expected allowed origin to be accepted");

  console.log("PASS allowed production origin");
}

async function testRejectedOrigin() {
  const env = {
    NODE_ENV: "production",
    ALLOWED_ORIGINS: "https://merchant.example",
  };

  assert(
    !isOriginAllowed("https://evil.example", env),
    "expected unconfigured production origin to be rejected"
  );

  const result = await runCorsOriginCheck("https://evil.example", env);
  assert(result.error, "expected rejected origin to return an error");
  assert(result.allowed === undefined, "expected rejected origin not to be accepted");

  console.log("PASS rejected production origin");
}

async function testNoOriginAllowed() {
  const env = {
    NODE_ENV: "production",
    ALLOWED_ORIGINS: "https://merchant.example",
  };

  assert(isOriginAllowed(undefined, env), "expected no-origin request to be allowed");

  const result = await runCorsOriginCheck(undefined, env);
  assert(!result.error, "expected no-origin request to return no error");
  assert(result.allowed === true, "expected no-origin request to be accepted");

  console.log("PASS no-origin server-to-server request");
}

async function testDevelopmentPermissiveCors() {
  const env = {
    NODE_ENV: "development",
  };

  assert(
    isOriginAllowed("https://anything.example", env),
    "expected development origin to be allowed"
  );

  const result = await runCorsOriginCheck("https://anything.example", env);
  assert(!result.error, "expected development origin to return no error");
  assert(result.allowed === true, "expected development origin to be accepted");

  console.log("PASS permissive development CORS");
}

async function main() {
  await testAllowedOrigin();
  await testRejectedOrigin();
  await testNoOriginAllowed();
  await testDevelopmentPermissiveCors();
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
