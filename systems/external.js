function handleExternal(txn) {
  console.log("EXTERNAL_ROUTING_STARTED");

  if (txn.network === "EXTERNAL_PROCESSOR") {
    return handleExternalProcessor(txn);
  }

  if (txn.network === "CARD_NETWORK") {
    return handleCardNetwork(txn);
  }

  return {
    status: "DECLINED",
    reason: "Unsupported external network"
  };
}

function handleExternalProcessor(txn) {
  console.log("SENT_TO_EXTERNAL_PROCESSOR");

  return {
    status: "SUCCESS",
    system: "EXTERNAL_PROCESSOR",
    details: "Processed by external issuer processor"
  };
}

function handleCardNetwork(txn) {
  console.log("SENT_TO_CARD_NETWORK");

  return {
    status: "SUCCESS",
    system: "CARD_NETWORK",
    details: "Routed through card network to issuer"
  };
}

module.exports = { handleExternal };