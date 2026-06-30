const crypto = require("crypto");

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortValue(value[key]);
        return sorted;
      }, {});
  }

  return value;
}

function canonicalize(value) {
  return JSON.stringify(sortValue(value));
}

function createRequestHash(value) {
  return crypto.createHash("sha256").update(canonicalize(value)).digest("hex");
}

module.exports = {
  canonicalize,
  createRequestHash,
};
