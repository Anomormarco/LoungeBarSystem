require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function isLocalDatabase(connectionString) {
  try {
    const { hostname } = new URL(connectionString);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

function poolConfig(connectionString) {
  const config = { connectionString };
  const sslMode = (new URL(connectionString).searchParams.get("sslmode") || process.env.DATABASE_SSL_MODE || "").toLowerCase();
  const shouldUseSsl =
    !["disable", "allow", "prefer"].includes(sslMode) &&
    (sslMode || process.env.DATABASE_REQUIRE_SSL === "true" || (process.env.NODE_ENV === "production" && !isLocalDatabase(connectionString)));

  if (shouldUseSsl) {
    config.ssl = { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" };
  }

  return config;
}

async function migrationAlreadyApplied(pool, migrationName) {
  const result = await pool.query("SELECT to_regclass($1) AS table_name", ["public._source_migrations"]);
  if (!result.rows[0].table_name) {
    return isLegacyMigrationPresent(pool, migrationName);
  }

  const migration = await pool.query("SELECT 1 FROM _source_migrations WHERE name = $1", [migrationName]);
  return migration.rowCount > 0 || isLegacyMigrationPresent(pool, migrationName);
}

async function isLegacyMigrationPresent(pool, migrationName) {
  if (migrationName === "20260622000000_init") {
    const result = await pool.query("SELECT to_regclass($1) AS table_name", ["public.organizations"]);
    return Boolean(result.rows[0].table_name);
  }

  if (migrationName === "20260626000000_add_stripe_payment_metadata") {
    const result = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3",
      ["public", "subscriptions", "stripe_checkout_session_id"]
    );
    return result.rowCount > 0;
  }

  return false;
}

async function applyMigration(pool, migrationDir) {
  const migrationName = path.basename(migrationDir);
  const sqlPath = path.join(migrationDir, "migration.sql");

  if (await migrationAlreadyApplied(pool, migrationName)) {
    console.log(`Skipping ${migrationName}`);
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log(`Applying ${migrationName}`);

  await pool.query("BEGIN");
  try {
    await pool.query(sql);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _source_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query("INSERT INTO _source_migrations (name) VALUES ($1)", [migrationName]);
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool(poolConfig(process.env.DATABASE_URL));
  const migrationsDir = path.resolve(__dirname, "../prisma/migrations");
  const migrations = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrationsDir, entry.name))
    .sort();

  try {
    for (const migration of migrations) {
      await applyMigration(pool, migration);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
