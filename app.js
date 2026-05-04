const express = require("express");
const app = express();

console.log("APP STARTING...");
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is alive");
});

app.post("/pay", (req, res) => {
  const txn = req.body;

  console.log("🔥 Transaction received:", txn);

  res.json({
    status: "RECEIVED",
    message: "Transaction is in processing pipeline",
    transaction: txn
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
app.post("/pay", (req, res) => {
  const txn = req.body;

  console.log("Transaction received:", txn);

  res.json({
    status: "RECEIVED",
    message: "Transaction is being processed",
    data: txn
  });
});