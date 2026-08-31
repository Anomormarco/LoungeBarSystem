require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function isLocalDatabase(connectionString) {
  try {
    const { hostname } = new URL(connectionString);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

function createAdapter(connectionString) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const config = { connectionString };
  const sslMode = (new URL(connectionString).searchParams.get("sslmode") || process.env.DATABASE_SSL_MODE || "").toLowerCase();
  const shouldUseSsl =
    !["disable", "allow", "prefer"].includes(sslMode) &&
    (sslMode || process.env.DATABASE_REQUIRE_SSL === "true" || (process.env.NODE_ENV === "production" && !isLocalDatabase(connectionString)));

  if (shouldUseSsl) {
    config.ssl = { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" };
  }

  return new PrismaPg(config);
}

const adapter = createAdapter(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const readAdapter = createAdapter(process.env.READ_DATABASE_URL || process.env.DATABASE_URL);
const readPrisma = new PrismaClient({ adapter: readAdapter });

prisma.$read = readPrisma;

module.exports = prisma;
