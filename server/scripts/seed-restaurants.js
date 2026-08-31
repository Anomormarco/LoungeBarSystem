require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { createPrismaPgAdapter } = require("./prismaAdapter");

const adapter = createPrismaPgAdapter(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const coverImages = [
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80",
  "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80",
];

const interiorImages = [
  "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80",
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&q=80",
  "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=1200&q=80",
];

// Coordinates are clustered across restaurant-heavy Ulaanbaatar areas
// without placing anything on Sukhbaatar Square or forming a radius ring.
const restaurants = [
  ["Skyline Lounge", "Seoul street / central business area", 47.9151, 106.9114],
  ["Noir Social Club", "State Department Store west side", 47.9202, 106.9078],
  ["Velvet Room", "Shangri-La / central south-east", 47.9127, 106.9249],
  ["Amber Terrace", "Embassy row / central east", 47.9189, 106.9316],
  ["Mellow Garden", "Marshall bridge / Khan-Uul north", 47.9078, 106.9186],
  ["The Brass Bar", "100 ail / central north", 47.9246, 106.9189],
  ["Aurora Lounge", "3rd and 4th khoroolol / Bayangol", 47.9182, 106.8876],
  ["Nomad Table", "Gandan / Bayangol east", 47.9106, 106.8798],
  ["Crown & Smoke", "Bogd-Ar / Khan-Uul west", 47.8954, 106.9025],
  ["Saffron Rooftop", "Zaisan Hill area", 47.8843, 106.9156],
  ["Luna Bistro", "River Garden / Khan-Uul", 47.889, 106.9445],
  ["Echo Lounge", "Hunnu Mall / Khan-Uul", 47.894, 106.879],
  ["Golden Hour", "Yarmag east / Khan-Uul", 47.9032, 106.8478],
  ["Urban Flame", "Moscow district / west city", 47.9288, 106.8587],
  ["Opal Room", "Denjiin 1000 / north-west city", 47.9406, 106.8849],
  ["Mint Social", "5 Shar / Songino Khairkhan", 47.9135, 106.805],
  ["Horizon Grill", "Tolgoit / Songino Khairkhan north-west", 47.9492, 106.8217],
  ["Cedar Lounge", "7 Buudal / Chingeltei north", 47.9665, 106.93],
  ["Ivory Table", "Belkh lower area", 47.9814, 106.9568],
  ["Copper House", "Belkh / Selkh lower area", 47.9962, 106.9385],
  ["Jade Garden", "Sansar / Bayanzurkh west", 47.9255, 106.947],
  ["Monarch Lounge", "13th district / Bayanzurkh", 47.913, 106.9482],
  ["Naran Terrace", "Bayanzurkh tovchoo road", 47.909, 106.988],
  ["Pearl Bistro", "Botanik / Amgalan edge", 47.9178, 107.018],
  ["Aria Lounge", "National Park / south-east city", 47.8836, 106.985],
  ["Tempo Kitchen", "Hunnu Mall south / Khan-Uul", 47.894, 106.879],
  ["Breeze Rooftop", "Dunjingarav / Bayanzurkh north-east", 47.948, 106.965],
].map(([name, address, latitude, longitude], index) => ({
  name,
  address,
  latitude,
  longitude,
  description: `${name} нь ойролцоох ширээ захиалга, VIP өрөө, оройн хоол болон lounge уур амьсгалыг нэг дор санал болгодог.`,
  phone: `+976 77${String(100000 + index).slice(1)}`,
  exteriorImages: [coverImages[index % coverImages.length], coverImages[(index + 2) % coverImages.length]],
  interiorImages: [interiorImages[index % interiorImages.length], interiorImages[(index + 3) % interiorImages.length]],
  openingTime: index % 3 === 0 ? "10:00" : "11:00",
  closingTime: index % 4 === 0 ? "02:00" : "00:00",
}));

function ownerEmailFromName(name) {
  return `${String(name).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "")}@gmail.com`;
}

function ownerEmail(index) {
  return ownerEmailFromName(restaurants[index].name);
}

function legacyOwnerEmails(index) {
  return [`owner${index + 1}@gmail.com`, `owner${index + 1}@loungebar.mn`];
}

const menuImages = {
  Food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
  Drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=80",
  Dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80",
  Alcohol: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=900&q=80",
  Snack: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=900&q=80",
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
};

const menuTemplate = [
  ["Coffee", "Signature Americano", "Fresh espresso coffee", 8500, menuImages.Coffee],
  ["Drink", "Honey Ginger Tea", "Honey and ginger hot tea", 7500, menuImages.Drink],
  ["Food", "Grilled Chicken Bowl", "Chicken, rice and seasonal vegetables", 28500, menuImages.Food],
  ["Food", "Beef Tenderloin", "Tender beef with potato mash and house sauce", 52000, menuImages.Food],
  ["Dessert", "Chocolate Lava Cake", "Warm chocolate dessert", 16500, menuImages.Dessert],
  ["Alcohol", "House Cocktail", "Signature lounge cocktail", 24500, menuImages.Alcohol],
];

function buildTables(organizationId) {
  return Array.from({ length: 12 }, (_, index) => ({
    organizationId,
    tableNumber: String(index + 1).padStart(2, "0"),
    capacity: index % 4 === 0 ? 6 : index % 3 === 0 ? 4 : 2,
    type: index % 5 === 0 ? "vip" : "normal",
    status: index % 7 === 0 ? "reserved" : "available",
  }));
}

async function upsertOrganization(data) {
  const existing = await prisma.organization.findFirst({ where: { name: data.name } });
  const payload = {
    ...data,
    subscriptionStatus: "active",
    subscriptionExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    isApproved: true,
  };

  if (existing) {
    return prisma.organization.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.organization.create({ data: payload });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  await prisma.organization.deleteMany({
    where: {
      name: {
        in: ["Onyx Social", "Lotus Lounge", "Prime Table", "Gate1", "Gate2"],
      },
    },
  });

  const password = await bcrypt.hash("Password123!", 10);

  await prisma.admin.upsert({
    where: { email: "admin@loungebar.mn" },
    update: { password, role: "super_admin" },
    create: {
      name: "Super Admin",
      email: "admin@loungebar.mn",
      password,
      role: "super_admin",
    },
  });

  for (const [index, restaurant] of restaurants.entries()) {
    const organization = await upsertOrganization(restaurant);

    await prisma.menuItem.deleteMany({ where: { organizationId: organization.id } });
    await prisma.menuItem.createMany({
      data: menuTemplate.map(([category, name, description, price, image]) => ({
        organizationId: organization.id,
        category,
        name,
        description,
        price,
        image,
        isAvailable: true,
      })),
    });

    for (const table of buildTables(organization.id)) {
      await prisma.table.upsert({
        where: {
          organizationId_tableNumber: {
            organizationId: organization.id,
            tableNumber: table.tableNumber,
          },
        },
        update: {
          capacity: table.capacity,
          type: table.type,
          status: table.status,
          customStatusLabel: null,
        },
        create: table,
      });
    }

    const email = ownerEmail(index);
    const existingOwner =
      (await prisma.staff.findFirst({ where: { organizationId: organization.id, email } })) ||
      (await prisma.staff.findFirst({
        where: { organizationId: organization.id, email: { in: legacyOwnerEmails(index) } },
      }));

    if (existingOwner) {
      await prisma.staff.update({
        where: { id: existingOwner.id },
        data: {
          name: organization.name,
          email,
          phone: restaurant.phone,
          password,
          role: "manager",
        },
      });
    } else {
      await prisma.staff.create({
        data: {
          organizationId: organization.id,
          name: organization.name,
          email,
          phone: restaurant.phone,
          password,
          role: "manager",
        },
      });
    }
  }

  console.log(`Seeded ${restaurants.length} restaurants with tables, menu items, owners, and admin account.`);
  console.log("Admin: admin@loungebar.mn / Password123!");
  console.log("Owners: lounge-name@gmail.com accounts / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
