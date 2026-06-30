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

const baseTables = [
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

const menuImages = {
  Food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
  Drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=80",
  Dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80",
  Alcohol: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=900&q=80",
  Snack: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=900&q=80",
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
};

const baseMenuItems = [
  ["Coffee", "Signature Americano", "Fresh espresso with clean bitter finish", 8500, menuImages.Coffee],
  ["Drink", "Honey Ginger Tea", "Hot tea with honey and ginger", 7500, menuImages.Drink],
  ["Drink", "Berry Mocktail", "Berry, citrus and soda signature mocktail", 15500, menuImages.Drink],
  ["Alcohol", "Classic Mojito", "Mint, lime and sparkling cocktail", 18000, menuImages.Alcohol],
  ["Food", "Grilled Chicken Bowl", "Chicken, rice and seasonal vegetables", 28500, menuImages.Food],
  ["Food", "Beef Tenderloin", "Tender beef with potato mash and house sauce", 52000, menuImages.Food],
  ["Food", "Seafood Pasta", "Creamy pasta with shrimp and herbs", 38500, menuImages.Food],
  ["Snack", "Truffle Fries", "Crispy fries with truffle seasoning", 16500, menuImages.Snack],
  ["Snack", "Chicken Wings", "Spicy glazed wings with dip", 24500, menuImages.Snack],
  ["Dessert", "Chocolate Lava Cake", "Warm chocolate cake with soft center", 16500, menuImages.Dessert],
  ["Dessert", "Cheesecake", "Creamy cheesecake with berry sauce", 14500, menuImages.Dessert],
  ["Food", "VIP Platter", "Shared meat, snack and dessert platter", 98000, menuImages.Food],
];

const lounges = [
  {
    name: "Gate1",
    address: "Bagshiin Deed west side, Sukhbaatar District",
    latitude: 47.9221,
    longitude: 106.9272,
    phone: "+976 99000011",
    description:
      "Gate1 is a central lounge near Bagshiin Deed with VIP tables, dinner menu, staff management and live reservations.",
    ownerPassword: "Gate1@123",
    staff: [
      ["Gate1 Owner", "gate@gmail.com", "manager", "99000011"],
      ["Gate1 Waiter", "gate1.waiter@gmail.com", "waiter", "99000012"],
      ["Gate1 Cashier", "gate1.cashier@gmail.com", "cashier", "99000013"],
    ],
  },
  {
    name: "Gate2",
    address: "Bagshiin Deed east side, Sukhbaatar District",
    latitude: 47.9215,
    longitude: 106.9298,
    phone: "+976 99001122",
    description:
      "Gate2 is a modern central lounge with terrace seating, VIP tables, exterior/interior gallery and extended menu.",
    ownerPassword: "Gate2@123",
    staff: [
      ["Gate2 Manager", "gate2.manager@gmail.com", "manager", "99001122"],
      ["Gate2 Waiter", "gate2.waiter@gmail.com", "waiter", "99001123"],
      ["Gate2 Cashier", "gate2.cashier@gmail.com", "cashier", "99001124"],
    ],
  },
];

function subscriptionExpiry() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

async function upsertOrganization(lounge) {
  const existing = await prisma.organization.findFirst({
    where: { name: { equals: lounge.name, mode: "insensitive" } },
  });

  const data = {
    name: lounge.name,
    description: lounge.description,
    address: lounge.address,
    latitude: lounge.latitude,
    longitude: lounge.longitude,
    phone: lounge.phone,
    exteriorImages,
    interiorImages,
    openingTime: "10:00",
    closingTime: "23:00",
    subscriptionStatus: "active",
    subscriptionExpiry: subscriptionExpiry(),
    isApproved: true,
  };

  if (existing) {
    return prisma.organization.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.organization.create({ data });
}

async function upsertTables(organizationId) {
  for (const [tableNumber, capacity, type, status] of baseTables) {
    await prisma.table.upsert({
      where: {
        organizationId_tableNumber: {
          organizationId,
          tableNumber,
        },
      },
      update: { capacity, type, status },
      create: {
        organizationId,
        tableNumber,
        capacity,
        type,
        status,
      },
    });
  }
}

async function upsertMenuItems(organizationId, prefix) {
  for (const [category, baseName, description, price, image] of baseMenuItems) {
    const name = baseName.includes("VIP") || baseName.includes("Berry") ? `${prefix} ${baseName}` : baseName;
    const existing = await prisma.menuItem.findFirst({
      where: { organizationId, name },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: { category, description, price, image, isAvailable: true },
      });
    } else {
      await prisma.menuItem.create({
        data: {
          organizationId,
          category,
          name,
          description,
          price,
          image,
          isAvailable: true,
        },
      });
    }
  }
}

async function upsertStaff(organizationId, staff, ownerPassword) {
  const hashedPassword = await bcrypt.hash(ownerPassword, 10);

  for (const [name, email, role, phone] of staff) {
    await prisma.staff.upsert({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
      update: { name, phone, role, password: hashedPassword },
      create: {
        organizationId,
        name,
        email,
        phone,
        role,
        password: hashedPassword,
      },
    });
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const seeded = [];

  for (const lounge of lounges) {
    const organization = await upsertOrganization(lounge);
    await upsertTables(organization.id);
    await upsertMenuItems(organization.id, lounge.name);
    await upsertStaff(organization.id, lounge.staff, lounge.ownerPassword);

    const counts = await prisma.organization.findUnique({
      where: { id: organization.id },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        isApproved: true,
        _count: { select: { tables: true, menuItems: true, staff: true } },
      },
    });
    seeded.push(counts);
  }

  console.log(JSON.stringify(seeded, null, 2));
  console.log("Gate1 owner: gate@gmail.com / Gate1@123");
  console.log("Gate2 owner: gate2.manager@gmail.com / Gate2@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
