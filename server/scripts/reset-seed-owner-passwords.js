require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { createPrismaPgAdapter } = require("./prismaAdapter");

const OWNER_PASSWORD = "Password123!";

const OWNER_ORGANIZATIONS = [
  "Skyline Lounge",
  "Noir Social Club",
  "Velvet Room",
  "Amber Terrace",
  "Mellow Garden",
  "The Brass Bar",
  "Aurora Lounge",
  "Nomad Table",
  "Crown & Smoke",
  "Saffron Rooftop",
  "Luna Bistro",
  "Echo Lounge",
  "Golden Hour",
  "Urban Flame",
  "Opal Room",
  "Mint Social",
  "Horizon Grill",
  "Cedar Lounge",
  "Ivory Table",
  "Copper House",
  "Jade Garden",
  "Monarch Lounge",
  "Naran Terrace",
  "Pearl Bistro",
  "Aria Lounge",
  "Tempo Kitchen",
  "Breeze Rooftop",
  "Onyx Social",
  "Lotus Lounge",
  "Prime Table",
];

function ownerEmailFromName(name) {
  return `${String(name).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "")}@gmail.com`;
}

function legacyOwnerEmails(index) {
  return [`owner${index + 1}@gmail.com`, `owner${index + 1}@loungebar.mn`];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const adapter = createPrismaPgAdapter(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });
  const password = await bcrypt.hash(OWNER_PASSWORD, 10);
  let updated = 0;
  let missing = 0;

  try {
    for (const [index, organizationName] of OWNER_ORGANIZATIONS.entries()) {
      const nextEmail = ownerEmailFromName(organizationName);
      const organization = await prisma.organization.findFirst({ where: { name: organizationName } });

      if (!organization) {
        missing += 1;
        continue;
      }

      const staff =
        (await prisma.staff.findFirst({
          where: { organizationId: organization.id, email: nextEmail, role: "manager" },
        })) ||
        (await prisma.staff.findFirst({
          where: { organizationId: organization.id, email: { in: legacyOwnerEmails(index) }, role: "manager" },
        }));

      if (staff) {
        await prisma.staff.update({
          where: { id: staff.id },
          data: {
            name: organization.name,
            email: nextEmail,
            password,
            role: "manager",
          },
        });
      } else {
        await prisma.staff.create({
          data: {
            organizationId: organization.id,
            name: organization.name,
            phone: organization.phone || null,
            email: nextEmail,
            password,
            role: "manager",
          },
        });
      }

      const duplicateLegacy = await prisma.staff.findMany({
        where: {
          organizationId: organization.id,
          email: { in: legacyOwnerEmails(index) },
          role: "manager",
          NOT: { email: nextEmail },
        },
      });

      for (const duplicate of duplicateLegacy) {
        await prisma.staff.update({
          where: { id: duplicate.id },
          data: {
            name: organization.name,
            password,
            role: "manager",
          },
        });
      }

      updated += 1;
    }

    console.log(`Updated ${updated} owner accounts. Missing ${missing}.`);
    console.log(`Owners: lounge-name@gmail.com accounts / ${OWNER_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
