require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const OWNER_PASSWORD = "Password123!";

function gmailOwnerEmail(index) {
  return `owner${index + 1}@gmail.com`;
}

function legacyOwnerEmail(index) {
  return `owner${index + 1}@loungebar.mn`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const password = await bcrypt.hash(OWNER_PASSWORD, 10);
  let updated = 0;
  let missing = 0;

  try {
    for (let index = 0; index < 30; index += 1) {
      const nextEmail = gmailOwnerEmail(index);
      const oldEmail = legacyOwnerEmail(index);
      const staff =
        (await prisma.staff.findFirst({ where: { email: nextEmail, role: "manager" } })) ||
        (await prisma.staff.findFirst({ where: { email: oldEmail, role: "manager" } }));

      if (!staff) {
        missing += 1;
        continue;
      }

      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          email: nextEmail,
          password,
          role: "manager",
        },
      });
      updated += 1;
    }

    console.log(`Updated ${updated} owner accounts. Missing ${missing}.`);
    console.log(`Owners: owner1@gmail.com ... owner30@gmail.com / ${OWNER_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
