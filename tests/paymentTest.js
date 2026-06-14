const http = require("http");

const data = JSON.stringify({
  amount: 500,
  fromAccount: "A123",
  toAccount: "B456",
  type: "PURCHASE",
  channel: "DOMESTIC_POS",
  issuerType: "INTERNAL",
  pin: "1234",
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/pay",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
    "x-api-key": process.env.API_KEY || "dev-api-key",
    "x-idempotency-key": `test-${Date.now()}`,
  },
};

const req = http.request(options, (res) => {
  let body = "";

  console.log(`STATUS: ${res.statusCode}`);

  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    console.log("Response:");
    console.log(JSON.parse(body));
  });
});

req.on("error", (error) => {
  console.error("Test failed:", error);
});

req.write(data);
req.end();
