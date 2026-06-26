require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const readAdapter = new PrismaPg({
  connectionString: process.env.READ_DATABASE_URL || process.env.DATABASE_URL,
});
const readPrisma = new PrismaClient({ adapter: readAdapter });

prisma.$read = readPrisma;

module.exports = prisma;
