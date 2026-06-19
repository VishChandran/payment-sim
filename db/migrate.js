const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pool = require("./connection");

const MIGRATIONS_DIRECTORY = path.join(__dirname, "migrations");
const MIGRATION_LOCK_ID = 73194621;

function listMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIRECTORY)
    .filter((fileName) => /^\d+_[a-z0-9_]+\.sql$/.test(fileName))
    .sort();
}

function checksum(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const version of listMigrations()) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIRECTORY, version), "utf8");
      const migrationChecksum = checksum(sql);
      const existing = await client.query(
        "SELECT checksum FROM schema_migrations WHERE version = $1",
        [version]
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== migrationChecksum) {
          throw new Error(`Applied migration was modified: ${version}`);
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
          [version, migrationChecksum]
        );
        await client.query("COMMIT");
        console.log(`MIGRATION_APPLIED: ${version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => {});
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("MIGRATIONS_COMPLETE");
      await pool.end();
    })
    .catch(async (error) => {
      console.error("MIGRATION_FAILED:", error.message);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { checksum, listMigrations, migrate };
