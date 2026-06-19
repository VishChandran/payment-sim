const startedAt = Date.now();
const requests = new Map();
const durations = new Map();

function metricKey(method, route, status) {
  return JSON.stringify([method, route, String(status)]);
}

function recordHttpMetrics(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
    const key = metricKey(req.method, route, res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    requests.set(key, (requests.get(key) || 0) + 1);
    const currentDuration = durations.get(key) || { count: 0, sum: 0 };
    currentDuration.count += 1;
    currentDuration.sum += durationSeconds;
    durations.set(key, currentDuration);
  });

  next();
}

function labels(key) {
  const [method, route, status] = JSON.parse(key);
  const safeRoute = route.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `{method="${method}",route="${safeRoute}",status="${status}"}`;
}

async function renderMetrics(pool) {
  const [transactionStatuses, outboxStatuses, deadLetters] = await Promise.all([
    pool.query("SELECT status, COUNT(*)::integer AS count FROM transactions GROUP BY status"),
    pool.query("SELECT status, COUNT(*)::integer AS count FROM outbox_events GROUP BY status"),
    pool.query("SELECT COUNT(*)::integer AS count FROM dead_letter_jobs"),
  ]);
  const lines = [
    "# HELP payment_sim_uptime_seconds Process uptime in seconds.",
    "# TYPE payment_sim_uptime_seconds gauge",
    `payment_sim_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
    "# HELP payment_sim_http_requests_total HTTP requests handled by the API.",
    "# TYPE payment_sim_http_requests_total counter",
  ];

  for (const [key, count] of requests) {
    lines.push(`payment_sim_http_requests_total${labels(key)} ${count}`);
  }

  lines.push(
    "# HELP payment_sim_http_request_duration_seconds HTTP request duration.",
    "# TYPE payment_sim_http_request_duration_seconds summary"
  );
  for (const [key, duration] of durations) {
    lines.push(`payment_sim_http_request_duration_seconds_count${labels(key)} ${duration.count}`);
    lines.push(`payment_sim_http_request_duration_seconds_sum${labels(key)} ${duration.sum}`);
  }

  lines.push(
    "# HELP payment_sim_db_pool_connections PostgreSQL pool connections.",
    "# TYPE payment_sim_db_pool_connections gauge",
    `payment_sim_db_pool_connections{state="total"} ${pool.totalCount}`,
    `payment_sim_db_pool_connections{state="idle"} ${pool.idleCount}`,
    `payment_sim_db_pool_connections{state="waiting"} ${pool.waitingCount}`
  );

  lines.push(
    "# HELP payment_sim_transactions Transactions by lifecycle status.",
    "# TYPE payment_sim_transactions gauge"
  );
  for (const row of transactionStatuses.rows) {
    lines.push(`payment_sim_transactions{status="${row.status}"} ${row.count}`);
  }

  lines.push(
    "# HELP payment_sim_outbox_events Outbox events by status.",
    "# TYPE payment_sim_outbox_events gauge"
  );
  for (const row of outboxStatuses.rows) {
    lines.push(`payment_sim_outbox_events{status="${row.status}"} ${row.count}`);
  }

  lines.push(
    "# HELP payment_sim_dead_letter_jobs Durable dead-letter job count.",
    "# TYPE payment_sim_dead_letter_jobs gauge",
    `payment_sim_dead_letter_jobs ${deadLetters.rows[0].count}`
  );

  return `${lines.join("\n")}\n`;
}

module.exports = { recordHttpMetrics, renderMetrics };
