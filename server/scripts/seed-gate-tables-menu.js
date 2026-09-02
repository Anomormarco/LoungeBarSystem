// Adds a full 20-table layout and a varied, category-matched menu to Gate1
// and Gate2 specifically - and nothing else about them. Unlike
// seed-restaurants.js and seed-gate2.js, this script never touches their
// organization record (subscription/description/images), password, or
// staff - Gate1/Gate2 are meant to keep whatever those already are.
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { createPrismaPgAdapter } = require("./prismaAdapter");

const adapter = createPrismaPgAdapter(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const ORG_NAMES = ["Gate1", "Gate2"];

// 20 tables: 10 normal (mixed capacity), 4 VIP, 3 terrace, 3 bar-height.
const tables = [
  ["01", 2, "normal", "available"],
  ["02", 2, "normal", "available"],
  ["03", 4, "normal", "available"],
  ["04", 4, "normal", "available"],
  ["05", 4, "normal", "reserved"],
  ["06", 6, "normal", "available"],
  ["07", 6, "normal", "available"],
  ["08", 2, "normal", "available"],
  ["09", 4, "normal", "reserved"],
  ["10", 6, "normal", "available"],
  ["VIP-01", 6, "vip", "available"],
  ["VIP-02", 8, "vip", "available"],
  ["VIP-03", 10, "vip", "reserved"],
  ["VIP-04", 8, "vip", "available"],
  ["TERRACE-01", 4, "normal", "available"],
  ["TERRACE-02", 4, "normal", "available"],
  ["TERRACE-03", 6, "normal", "available"],
  ["BAR-01", 2, "normal", "available"],
  ["BAR-02", 2, "normal", "available"],
  ["BAR-03", 2, "normal", "available"],
];

// Each item's image matches its own category (never a mismatched photo -
// a coffee gets a coffee photo, a cocktail gets an alcohol photo, etc).
const menuImages = {
  Food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
  Drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=80",
  Dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80",
  Alcohol: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=900&q=80",
  Snack: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=900&q=80",
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
};

const menuItems = [
  ["Coffee", "Signature Americano", "Шинэхэн espresso, цэвэрхэн гашуун амттай", 8500, menuImages.Coffee],
  ["Coffee", "Caramel Latte", "Каррамель, уураар хөөсрүүлсэн сүүтэй кофе", 10500, menuImages.Coffee],
  ["Drink", "Honey Ginger Tea", "Зөгийн бал, гянжуурт цай", 7500, menuImages.Drink],
  ["Drink", "Berry Mocktail", "Жимс, цитрус, содтой mocktail", 15500, menuImages.Drink],
  ["Alcohol", "Classic Mojito", "Мента, шар лаймтай коктейль", 18000, menuImages.Alcohol],
  ["Alcohol", "House Whiskey Sour", "Виски, лайм, өндөгний цагаантай коктейль", 22000, menuImages.Alcohol],
  ["Food", "Grilled Chicken Bowl", "Тахиа, будаа, улирлын ногоотой", 28500, menuImages.Food],
  ["Food", "Beef Tenderloin", "Зөөлөн үхрийн мах, төмсний зутантай", 52000, menuImages.Food],
  ["Food", "Seafood Pasta", "Далайн хясаа, сам хорхойтой паста", 38500, menuImages.Food],
  ["Snack", "Truffle Fries", "Трюфелийн амттай хумхуур төмс", 16500, menuImages.Snack],
  ["Snack", "Chicken Wings", "Халуун соустай шарсан тахианы далавч", 24500, menuImages.Snack],
  ["Dessert", "Chocolate Lava Cake", "Дотор нь шингэн шоколадтай дулаан кекс", 16500, menuImages.Dessert],
  ["Dessert", "Cheesecake", "Жимсний соустай зөөлөн чизкейк", 14500, menuImages.Dessert],
  ["Food", "VIP Sharing Platter", "Мах, зууш, амттангийн хамтарсан таваг", 98000, menuImages.Food],
];

async function findOrg(name) {
  const org = await prisma.organization.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (!org) {
    console.warn(`[seed-gate-tables-menu] "${name}" олдсонгүй, алгаслаа.`);
  }
  return org;
}

async function upsertTables(organizationId) {
  for (const [tableNumber, capacity, type, status] of tables) {
    await prisma.table.upsert({
      where: {
        organizationId_tableNumber: {
          organizationId,
          tableNumber,
        },
      },
      update: { capacity, type, status, customStatusLabel: null },
      create: { organizationId, tableNumber, capacity, type, status },
    });
  }
}

async function upsertMenu(organizationId) {
  for (const [category, name, description, price, image] of menuItems) {
    const existing = await prisma.menuItem.findFirst({ where: { organizationId, name } });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: { category, description, price, image, isAvailable: true },
      });
    } else {
      await prisma.menuItem.create({
        data: { organizationId, category, name, description, price, image, isAvailable: true },
      });
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  for (const name of ORG_NAMES) {
    const org = await findOrg(name);
    if (!org) continue;

    await upsertTables(org.id);
    await upsertMenu(org.id);

    const counts = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { id: true, name: true, _count: { select: { tables: true, menuItems: true } } },
    });
    console.log(JSON.stringify(counts));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
