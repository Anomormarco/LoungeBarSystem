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

// Coordinates are an organic scatter (not a radius ring) stretched further
// toward the city's north and south edges - kept in sync with
// client/src/components/LoungeMap.jsx's FALLBACK_MARKERS.
const restaurants = [
  ["Skyline Lounge", "Bogd Khan foothills, far south city", 47.7693, 106.8131],
  ["Noir Social Club", "Chingeltei north edge", 47.9732, 106.8225],
  ["Velvet Room", "Nisekh east side", 47.8897, 107.0182],
  ["Amber Terrace", "Nisekh south-east edge", 47.8402, 107.029],
  ["Mellow Garden", "Chingeltei north side", 47.966, 106.8976],
  ["The Brass Bar", "Tolgoit north edge", 47.9498, 106.8024],
  ["Aurora Lounge", "Bogd Khan foothills, far south", 47.7639, 106.9257],
  ["Nomad Table", "Zaisan south edge", 47.8025, 106.9807],
  ["Crown & Smoke", "Chingeltei north side", 48.0073, 106.9324],
  ["Saffron Rooftop", "Zaisan far south", 47.8196, 106.9767],
  ["Luna Bistro", "Tolgoit far north edge", 48.0765, 106.8346],
  ["Echo Lounge", "Khan-Uul south side", 47.851, 106.9123],
  ["Golden Hour", "Bogd Khan foothills, south", 47.7765, 106.9593],
  ["Urban Flame", "Bayangol west side", 47.9364, 106.8654],
  ["Opal Room", "Khan-Uul south-east side", 47.8735, 106.9861],
  ["Mint Social", "Bogd Khan foothills, south-west", 47.789, 106.9526],
  ["Horizon Grill", "Nisekh far north edge", 47.9921, 107.0035],
  ["Cedar Lounge", "Tolgoit far north edge", 48.0514, 106.8426],
  ["Ivory Table", "Chingeltei north side", 47.9849, 106.9016],
  ["Copper House", "Tolgoit north edge", 48.0361, 106.8467],
  ["Jade Garden", "Chingeltei far north edge", 48.0298, 106.9418],
  ["Monarch Lounge", "Songino Khairkhan south side", 47.8304, 106.8641],
  ["Naran Terrace", "Chingeltei far north edge", 48.0226, 106.9566],
  ["Pearl Bistro", "Nisekh far north edge", 48.0612, 107.0102],
  ["Aria Lounge", "Tolgoit far north edge", 48.0666, 106.8721],
  ["Tempo Kitchen", "Songino Khairkhan south side", 47.8609, 106.8896],
  ["Breeze Rooftop", "Khan-Uul south-east side", 47.895, 106.9954],
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
