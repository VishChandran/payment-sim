const config = {
  port: Number(process.env.PORT) || 3000,
  workerCount: Number(process.env.WORKER_COUNT) || 3,
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
  transactionLimit: Number(process.env.TRANSACTION_LIMIT) || 10000,
  balances: {
    defaultBalance: Number(process.env.DEFAULT_BALANCE) || 5000,
    inquiryBalance: Number(process.env.INQUIRY_BALANCE) || 2500,
  },

  supportedIssuerTypes: ["INTERNAL", "EXTERNAL"],

  supportedNetworks: ["TSYS", "MASTERCARD"],

  supportedTransactionTypes: [
    "PURCHASE",
    "CASH_WITHDRAWAL",
    "BALANCE_INQUIRY",
    "REVERSAL"
  ],

  supportedChannels: [
    "DOMESTIC_ATM",
    "INTERNATIONAL_ATM",
    "DOMESTIC_POS",
    "INTERNATIONAL_POS",
    "ECOM"
  ],

  riskRules: {
    internationalAtmLimit: 1000,
    ecommerceReviewLimit: 5000,
    internationalPosReviewLimit: 3000,
  },
}
module.exports = { config };