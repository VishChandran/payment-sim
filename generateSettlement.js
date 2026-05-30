const fs = require("fs");

const transactions = [
  { id: "TXN1001", type: "PURCHASE", amount: 100.25, status: "APPROVED" },
  { id: "TXN1002", type: "WITHDRAWAL", amount: 250.00, status: "APPROVED" },
  { id: "TXN1003", type: "BALANCE", amount: 0.00, status: "SUCCESS" },
  { id: "TXN1004", type: "PURCHASE", amount: 75.50, status: "DECLINED" }
];

function padRight(value, length) {
  return String(value).padEnd(length, " ");
}

function padLeft(value, length) {
  return String(value).padStart(length, "0");
}

const lines = transactions.map(txn => {
  const txnId = padRight(txn.id, 12);
  const type = padRight(txn.type, 12);
  const amount = padLeft(Math.round(txn.amount * 100), 10);
  const status = padRight(txn.status, 10);

  return `${txnId}${type}${amount}${status}`;
});

fs.writeFileSync("output/settlement.txt", lines.join("\n"));

console.log("Settlement file generated: output/settlement.txt");