function handleExternal(txn) {
  console.log("🌐 External routing started");

  if (txn.network === "TSYS") {
    return handleTSYS(txn);
  }

  if (txn.network === "MASTERCARD") {
    return handleMastercard(txn);
  }

  return {
    status: "DECLINED",
    reason: "Unsupported external network"
  };
}

function handleTSYS(txn) {
  console.log("🏢 Sent to TSYS");

  return {
    status: "SUCCESS",
    system: "TSYS",
    details: "Processed by TSYS external processor"
  };
}

function handleMastercard(txn) {
  console.log("💳 Sent to Mastercard network");

  return {
    status: "SUCCESS",
    system: "MASTERCARD_NETWORK",
    details: "Routed through Mastercard network to issuer"
  };
}

module.exports = { handleExternal };