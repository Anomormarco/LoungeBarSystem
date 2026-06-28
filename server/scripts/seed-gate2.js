require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const exteriorImages = [
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80",
  "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1200&q=80",
];

const interiorImages = [
  "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80",
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&q=80",
];

const tables = [
  ["01", 2, "normal", "available"],
  ["02", 2, "normal", "available"],
  ["03", 4, "normal", "available"],
  ["04", 4, "normal", "available"],
  ["05", 6, "normal", "available"],
  ["06", 6, "normal", "reserved"],
  ["VIP-01", 6, "vip", "available"],
  ["VIP-02", 8, "vip", "available"],
  ["VIP-03", 10, "vip", "reserved"],
  ["TERRACE-01", 4, "normal", "available"],
  ["TERRACE-02", 4, "normal", "available"],
  ["BAR-01", 2, "normal", "available"],
];

const menuItems = [
  ["Coffee & Tea", "Signature Americano", "Fresh espresso with clean bitter finish", 8500],
  ["Coffee & Tea", "Honey Ginger Tea", "Hot tea with honey and ginger", 7500],
  ["Drinks", "Gate2 Berry Mocktail", "Berry, citrus and soda signature mocktail", 15500],
  ["Drinks", "Classic Mojito", "Mint, lime and sparkling soda", 18000],
  ["Main", "Grilled Chicken Bowl", "Chicken, rice and seasonal vegetables", 28500],
  ["Main", "Beef Tenderloin", "Tender beef with potato mash and house sauce", 52000],
  ["Main", "Seafood Pasta", "Creamy pasta with shrimp and herbs", 38500],
  ["Snack", "Truffle Fries", "Crispy fries with truffle seasoning", 16500],
  ["Snack", "Chicken Wings", "Spicy glazed wings with dip", 24500],
  ["Dessert", "Chocolate Lava Cake", "Warm chocolate cake with soft center", 16500],
  ["Dessert", "Cheesecake", "Creamy cheesecake with berry sauce", 14500],
  ["VIP Set", "Gate2 VIP Platter", "Shared meat, snack and dessert platter", 98000],
];

const staff = [
  ["Gate2 Manager", "gate2.manager@gmail.com", "manager", "99001122"],
  ["Gate2 Waiter", "gate2.waiter@gmail.com", "waiter", "99001123"],
  ["Gate2 Cashier", "gate2.cashier@gmail.com", "cashier", "99001124"],
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const organization = await prisma.organization.findFirst({
    where: { name: { equals: "Gate2", mode: "insensitive" } },
  });

  if (!organization) {
    throw new Error("Gate2 organization not found");
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      description:
        "Gate2 нь хотын төвийн ойролцоох modern lounge, terrace seating, VIP ширээ болон оройн хоолны меню санал болгодог.",
      exteriorImages,
      interiorImages,
      openingTime: organization.openingTime || "10:00",
      closingTime: organization.closingTime || "23:00",
    },
  });

  for (const [tableNumber, capacity, type, status] of tables) {
    await prisma.table.upsert({
      where: {
        organizationId_tableNumber: {
          organizationId: organization.id,
          tableNumber,
        },
      },
      update: { capacity, type, status },
      create: {
        organizationId: organization.id,
        tableNumber,
        capacity,
        type,
        status,
      },
    });
  }

  for (const [category, name, description, price] of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { organizationId: organization.id, name },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: { category, description, price, isAvailable: true },
      });
    } else {
      await prisma.menuItem.create({
        data: {
          organizationId: organization.id,
          category,
          name,
          description,
          price,
          isAvailable: true,
        },
      });
    }
  }

  const password = await bcrypt.hash("Gate2@123", 10);
  for (const [name, email, role, phone] of staff) {
    await prisma.staff.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email,
        },
      },
      update: { name, phone, role },
      create: {
        organizationId: organization.id,
        name,
        email,
        phone,
        role,
        password,
      },
    });
  }

  const counts = await prisma.organization.findUnique({
    where: { id: organization.id },
    select: {
      id: true,
      name: true,
      exteriorImages: true,
      interiorImages: true,
      _count: { select: { tables: true, menuItems: true, staff: true } },
    },
  });

  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
