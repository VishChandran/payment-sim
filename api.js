const { app } = require("./app");
const { config } = require("./config/config");
const { validateApiKeyConfiguration } = require("./middleware/apiKeyAuth");

validateApiKeyConfiguration();

console.log("PORT FROM ENV:", process.env.PORT);
console.log("CONFIG PORT:", config.port);

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
