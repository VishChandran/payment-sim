function parseAllowedOrigins(env = process.env) {
  if (!env.ALLOWED_ORIGINS) {
    return [];
  }

  return env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isProduction(env = process.env) {
  return env.NODE_ENV === "production";
}

function isOriginAllowed(origin, env = process.env) {
  if (!origin) {
    return true;
  }

  if (!isProduction(env)) {
    return true;
  }

  return parseAllowedOrigins(env).includes(origin);
}

function buildCorsOptions(env = process.env) {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, env)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  };
}

module.exports = {
  buildCorsOptions,
  isOriginAllowed,
  parseAllowedOrigins,
};
