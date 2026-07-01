require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const OWNER_PASSWORD = "Password123!";
const OWNER_EMAILS = Array.from({ length: 30 }, (_, index) => `owner${index + 1}@loungebar.mn`);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const password = await bcrypt.hash(OWNER_PASSWORD, 10);

  try {
    const result = await prisma.staff.updateMany({
      where: {
        email: { in: OWNER_EMAILS },
        role: "manager",
      },
      data: { password },
    });

    console.log(`Reset ${result.count} owner passwords.`);
    console.log(`Owners: owner1@loungebar.mn ... owner30@loungebar.mn / ${OWNER_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
