const { canonicalize, createRequestHash } = require("../utils/requestHash");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const first = {
    amount: 500,
    fromAccount: "A123",
    nested: {
      b: 2,
      a: 1,
    },
  };
  const second = {
    nested: {
      a: 1,
      b: 2,
    },
    fromAccount: "A123",
    amount: 500,
  };
  const different = {
    ...second,
    amount: 700,
  };

  assert(canonicalize(first) === canonicalize(second), "same semantic request should canonicalize identically");
  assert(createRequestHash(first) === createRequestHash(second), "same semantic request should hash identically");
  assert(createRequestHash(first) !== createRequestHash(different), "different request should not hash identically");

  console.log("PASS canonical request hashing");
}

try {
  main();
} catch (error) {
  console.error("FAIL", error.message);
  process.exit(1);
}
