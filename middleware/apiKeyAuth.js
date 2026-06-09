function apiKeyAuth(req, res, next) {
  const configuredKey = process.env.API_KEY || "dev-api-key";
  const providedKey = req.header("x-api-key");

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      status: "REJECTED",
      reason: "Unauthorized API request",
    });
  }

  next();
}

module.exports = { apiKeyAuth };