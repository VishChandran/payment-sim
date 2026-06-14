const {
  authenticateApiKey,
  getConfiguredApiCredentials,
} = require("../middleware/apiKeyAuth");
const { canAccessTransactionStatus } = require("../middleware/statusAuthorization");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function clientAuth(key, env) {
  const credential = authenticateApiKey(key, getConfiguredApiCredentials(env));

  return credential
    ? {
        type: "client",
        clientId: credential.clientId,
      }
    : null;
}

function testOwnerCanViewTransaction() {
  const env = {
    NODE_ENV: "production",
    API_KEYS: "merchant-a:key-a,merchant-b:key-b",
  };
  const auth = clientAuth("key-a", env);
  const transaction = {
    txn_id: "txn-1",
    client_id: "merchant-a",
  };

  assert(canAccessTransactionStatus(auth, transaction), "expected owner to view transaction");
  console.log("PASS owner can view transaction");
}

function testDifferentClientDenied() {
  const env = {
    NODE_ENV: "production",
    API_KEYS: "merchant-a:key-a,merchant-b:key-b",
  };
  const auth = clientAuth("key-b", env);
  const transaction = {
    txn_id: "txn-1",
    client_id: "merchant-a",
  };

  assert(
    !canAccessTransactionStatus(auth, transaction),
    "expected different client to be denied"
  );
  console.log("PASS different client is denied");
}

function testAdminCanViewTransaction() {
  const auth = {
    type: "admin",
  };
  const transaction = {
    txn_id: "txn-1",
    client_id: "merchant-a",
  };

  assert(canAccessTransactionStatus(auth, transaction), "expected admin to view transaction");
  console.log("PASS admin can view transaction");
}

function main() {
  testOwnerCanViewTransaction();
  testDifferentClientDenied();
  testAdminCanViewTransaction();
}

try {
  main();
} catch (error) {
  console.error("FAIL", error.message);
  process.exit(1);
}
