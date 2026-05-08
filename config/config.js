const config = {
  port: 3000,

  workerCount: 3,

  maxRetries: 3,

  transactionLimit: 10000,

  balances: {
    defaultBalance: 5000,
    inquiryBalance: 2500
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
    internationalPosReviewLimit: 3000
  }
};

module.exports = { config };