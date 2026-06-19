const rateLimit = require("express-rate-limit");
const Redis = require("ioredis");

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20;

let redisClient;

function rateLimitResponse(res) {
  return res.status(429).json({
    status: "REJECTED",
    reason: "Too many requests. Please try again later.",
  });
}

function createRedisClient(env = process.env) {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  }

  return new Redis({
    host: env.REDIS_HOST || "127.0.0.1",
    port: Number(env.REDIS_PORT) || 6379,
    password: env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisClient();
    redisClient.on("error", (error) => {
      console.error("RATE_LIMIT_REDIS_ERROR:", error.message);
    });
  }
  return redisClient;
}

function createRedisRateLimiter(
  client,
  { windowMs = WINDOW_MS, maxRequests = MAX_REQUESTS } = {}
) {
  return (req, res, next) => {
    const key = `payment-sim:rate-limit:${req.ip}`;
    const script = `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
      end
      return {count, redis.call('PTTL', KEYS[1])}
    `;

    client
    .eval(script, 1, key, windowMs)
    .then(([count, ttl]) => {
      res.setHeader("RateLimit-Limit", maxRequests);
      res.setHeader("RateLimit-Remaining", Math.max(0, maxRequests - count));
      res.setHeader("RateLimit-Reset", Math.max(0, Math.ceil(ttl / 1000)));

      if (count > maxRequests) {
        return rateLimitResponse(res);
      }
      return next();
    })
    .catch((error) => {
      console.error("RATE_LIMIT_CHECK_FAILED:", error.message);
      res.status(503).json({
        status: "ERROR",
        reason: "Request protection service unavailable",
      });
    });
  };
}

function redisRateLimiter(req, res, next) {
  return createRedisRateLimiter(getRedisClient())(req, res, next);
}

const memoryRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => rateLimitResponse(res),
});

const apiRateLimiter =
  process.env.NODE_ENV === "production" ? redisRateLimiter : memoryRateLimiter;

async function pingRateLimiter() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return (await getRedisClient().ping()) === "PONG";
}

async function closeRateLimiter() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = undefined;
  }
}

module.exports = {
  apiRateLimiter,
  closeRateLimiter,
  createRedisClient,
  createRedisRateLimiter,
  pingRateLimiter,
};
