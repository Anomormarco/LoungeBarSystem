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

// Coordinates are spread evenly (by bearing) in a 15-20km ring around
// Sukhbaatar Square (47.9184, 106.9177) so no seed restaurant sits on the
// central square itself - see the distance/angle comment on each row.
const restaurants = [
  ["Skyline Lounge", "Chingeltei outer district, ~15.5km N of city center", 48.0576, 106.9177],
  ["Noir Social Club", "Chingeltei outer district, ~17.7km NNE of city center", 48.0708, 106.9848],
  ["Velvet Room", "Bayanzurkh outer district, ~19.7km NE of city center", 48.0731, 107.045],
  ["Amber Terrace", "Bayanzurkh outer district, ~15.6km NE of city center", 48.0234, 107.0553],
  ["Mellow Garden", "Bayanzurkh outer district, ~17.7km ENE of city center", 48.0127, 107.1094],
  ["The Brass Bar", "Bayanzurkh outer district, ~19.7km E of city center", 47.9785, 107.1664],
  ["Aurora Lounge", "Bayanzurkh outer district, ~15.6km E of city center", 47.9365, 107.1252],
  ["Nomad Table", "Bayanzurkh outer district, ~17.8km ESE of city center", 47.9044, 107.1553],
  ["Crown & Smoke", "Nalaikh road area, ~19.8km SE of city center", 47.8651, 107.1706],
  ["Saffron Rooftop", "Nalaikh road area, ~15.7km SE of city center", 47.8399, 107.092],
  ["Luna Bistro", "Khan-Uul outer district, ~17.9km SSE of city center", 47.8024, 107.0829],
  ["Echo Lounge", "Khan-Uul outer district, ~19.3km S of city center", 47.7699, 107.0521],
  ["Golden Hour", "Khan-Uul outer district, ~15.7km S of city center", 47.7847, 106.9856],
  ["Urban Flame", "Khan-Uul outer district, ~17.9km SSW of city center", 47.7585, 106.9443],
  ["Opal Room", "Khan-Uul outer district, ~19.4km SW of city center", 47.7469, 106.8723],
  ["Mint Social", "Songino Khairkhan outer district, ~15.8km SW of city center", 47.7875, 106.8368],
  ["Horizon Grill", "Songino Khairkhan outer district, ~18km WSW of city center", 47.7861, 106.7799],
  ["Cedar Lounge", "Songino Khairkhan outer district, ~19.5km W of city center", 47.8001, 106.7259],
  ["Ivory Table", "Songino Khairkhan outer district, ~15.8km W of city center", 47.8556, 106.7273],
  ["Copper House", "Songino Khairkhan outer district, ~17.5km WNW of city center", 47.881, 106.6897],
  ["Jade Garden", "Songino Khairkhan outer district, ~19.5km NW of city center", 47.9143, 106.6564],
  ["Monarch Lounge", "Bayangol outer district, ~15.9km NW of city center", 47.9459, 106.7088],
  ["Naran Terrace", "Bayangol outer district, ~17.6km NNW of city center", 47.9814, 106.7018],
  ["Pearl Bistro", "Chingeltei outer district, ~19.6km N of city center", 48.0312, 106.7168],
  ["Aria Lounge", "Chingeltei outer district, ~15.9km N of city center", 48.0318, 106.7873],
  ["Tempo Kitchen", "Chingeltei outer district, ~17.6km NNE of city center", 48.0617, 106.8172],
  ["Breeze Rooftop", "Chingeltei outer district, ~19.6km NNE of city center", 48.0902, 106.8598],
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
