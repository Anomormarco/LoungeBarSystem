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

// 20 of 27 restaurants fill the numbered-khoroolol belt (roughly khoroolol
// 1-13) as a real 2D neighborhood spread, not a thin line; the remaining 7
// sit further out toward genuine outskirts in varied directions. Kept in
// sync with client/src/components/LoungeMap.jsx's FALLBACK_MARKERS.
const restaurants = [
  ["Skyline Lounge", "Nisekh far east edge", 47.8404, 107.0563],
  ["Noir Social Club", "8th khoroolol area", 47.9489, 106.9526],
  ["Velvet Room", "6th khoroolol area", 47.8888, 106.8534],
  ["Amber Terrace", "Officers' Palace area, city center", 47.9004, 106.907],
  ["Mellow Garden", "4th khoroolol area", 47.9418, 106.9204],
  ["The Brass Bar", "13th khoroolol area", 47.9364, 106.9954],
  ["Aurora Lounge", "Bogd Khan foothills, far south edge", 47.7618, 106.9381],
  ["Nomad Table", "Songino Khairkhan far west edge", 47.9465, 106.6801],
  ["Crown & Smoke", "3rd khoroolol area", 47.9346, 106.8855],
  ["Saffron Rooftop", "10th khoroolol area", 47.931, 106.8641],
  ["Luna Bistro", "5th khoroolol area", 47.9265, 106.8319],
  ["Echo Lounge", "10th khoroolol east side", 47.904, 106.8426],
  ["Golden Hour", "Chingeltei north edge", 48.0194, 106.9879],
  ["Urban Flame", "Tolgoit north-west edge", 48.0189, 106.7919],
  ["Opal Room", "State Department Store area", 47.9076, 106.9847],
  ["Mint Social", "10th khoroolol west side", 47.9507, 106.8748],
  ["Horizon Grill", "Sukhbaatar Square vicinity", 47.9148, 106.9311],
  ["Cedar Lounge", "Peace Avenue central", 47.9094, 106.9633],
  ["Ivory Table", "Nisekh far east edge", 47.9368, 107.0735],
  ["Copper House", "1st khoroolol area", 47.9462, 106.8199],
  ["Jade Garden", "Bogd Khan foothills, west edge", 47.8986, 106.8078],
  ["Monarch Lounge", "Amgalan area", 47.9238, 107.0169],
  ["Naran Terrace", "Zaisan foothill area", 47.8906, 106.974],
  ["Pearl Bistro", "Gandan area", 47.94, 106.9418],
  ["Aria Lounge", "Sansar area", 47.8932, 106.8963],
  ["Tempo Kitchen", "Bogd Khan foothills, south-west edge", 47.8249, 106.7514],
  ["Breeze Rooftop", "Amgalan bridge area", 47.8861, 107.0062],
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

function sixMonthsFromNow() {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date;
}

async function upsertOrganization(data) {
  const existing = await prisma.organization.findFirst({ where: { name: data.name } });
  const payload = {
    ...data,
    subscriptionStatus: "active",
    subscriptionExpiry: sixMonthsFromNow(),
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

// Records the 6-month activation as a real "paid" entry in the payment
// history table (what subscriptionRequired actually gates on is the
// Organization's own subscriptionStatus/subscriptionExpiry above, set by
// upsertOrganization - this is purely so the owner's payment history shows
// something other than "no history" for an org whose access was granted
// this way). Idempotent: skip if this org already has a successful payment.
async function ensureSixMonthPaymentRecord(organizationId) {
  const existing = await prisma.payment.findFirst({
    where: { organizationId, paymentStatus: "success" },
  });
  if (existing) return existing;

  const periodEnd = sixMonthsFromNow();
  return prisma.payment.create({
    data: {
      organizationId,
      planType: "6 сарын багц",
      amount: 300000,
      currency: "mnt",
      paymentMethod: "qpay",
      paymentStatus: "success",
      paidAt: new Date(),
      periodStart: new Date(),
      periodEnd,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  // Gate1/Gate2 are kept untouched now (no longer auto-deleted, and not
  // part of the loop below - their registration, subscription and password
  // stay exactly as they already are).
  await prisma.organization.deleteMany({
    where: {
      name: {
        in: ["Onyx Social", "Lotus Lounge", "Prime Table"],
      },
    },
  });

  // Organization owner accounts get the new shared password; the admin
  // account is untouched (still Password123!) - the request was specifically
  // "all organizations' password", not the platform admin.
  const password = await bcrypt.hash("Zk94387282@", 10);
  const adminPassword = await bcrypt.hash("Password123!", 10);

  await prisma.admin.upsert({
    where: { email: "admin@loungebar.mn" },
    update: { password: adminPassword, role: "super_admin" },
    create: {
      name: "Super Admin",
      email: "admin@loungebar.mn",
      password: adminPassword,
      role: "super_admin",
    },
  });

  for (const [index, restaurant] of restaurants.entries()) {
    const organization = await upsertOrganization(restaurant);
    await ensureSixMonthPaymentRecord(organization.id);

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

  console.log(`Seeded ${restaurants.length} restaurants with tables, menu items, owners, admin account, and 6-month активация.`);
  console.log("Admin: admin@loungebar.mn / Password123!");
  console.log("Owners: lounge-name@gmail.com accounts / Zk94387282@");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
