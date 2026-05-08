function logEvent(service, event, transactionId, details = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    service,
    event,
    transactionId,
    details
  };

  console.log(JSON.stringify(log));
}

module.exports = { logEvent };