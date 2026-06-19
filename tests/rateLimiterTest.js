const { createRedisRateLimiter } = require("../middleware/rateLimiter");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function invoke(redisResult) {
  const client = {
    eval: () =>
      redisResult instanceof Error
        ? Promise.reject(redisResult)
        : Promise.resolve(redisResult),
  };
  const limiter = createRedisRateLimiter(client, { windowMs: 60000, maxRequests: 2 });
  const res = response();
  let nextCalled = false;
  limiter({ ip: "127.0.0.1" }, res, () => {
    nextCalled = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { nextCalled, res };
}

async function main() {
  const allowed = await invoke([1, 60000]);
  assert(allowed.nextCalled, "expected request below Redis limit to proceed");
  assert(allowed.res.headers["RateLimit-Remaining"] === 1, "expected remaining header");

  const rejected = await invoke([3, 45000]);
  assert(!rejected.nextCalled, "expected request above Redis limit to stop");
  assert(rejected.res.statusCode === 429, "expected distributed limit rejection");

  const unavailable = await invoke(new Error("Redis unavailable"));
  assert(unavailable.res.statusCode === 503, "expected production limiter to fail closed");

  console.log("PASS Redis rate limiter allows, rejects, and fails closed");
}

main().catch((error) => {
  console.error("FAIL", error.stack || error.message || error);
  process.exit(1);
});
