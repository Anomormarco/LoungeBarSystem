require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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

const restaurants = [
  ["Skyline Lounge", "Sukhbaatar Square west side", 47.9184, 106.9177],
  ["Noir Social Club", "State Department Store area", 47.9162, 106.9097],
  ["Velvet Room", "Peace Avenue central west", 47.9178, 106.9024],
  ["Amber Terrace", "Tengis area, Chingeltei District", 47.9244, 106.9091],
  ["Mellow Garden", "Tedy Center west side", 47.9189, 106.8992],
  ["The Brass Bar", "Gandan, Bayangol District", 47.9219, 106.8957],
  ["Aurora Lounge", "Modnii 2 area", 47.9167, 106.8908],
  ["Nomad Table", "Khoroolol, Bayangol District", 47.9105, 106.8736],
  ["Crown & Smoke", "Sansar, Bayanzurkh District", 47.9314, 106.9498],
  ["Saffron Rooftop", "Zaisan, Khan-Uul District", 47.8846, 106.9164],
  ["Luna Bistro", "3rd District, Bayangol District", 47.9146, 106.8849],
  ["Echo Lounge", "13th Microdistrict, Bayanzurkh District", 47.9234, 106.9589],
  ["Golden Hour", "Bars west corridor", 47.9132, 106.8798],
  ["Urban Flame", "Ikh Mongol Street, Bayanzurkh District", 47.9107, 106.9698],
  ["Opal Room", "Gemtel hospital area", 47.9092, 106.8618],
  ["Mint Social", "Khoroolol north side", 47.9186, 106.8764],
  ["Horizon Grill", "100 Ail, Sukhbaatar District", 47.9372, 106.9228],
  ["Cedar Lounge", "National Garden Park east side", 47.9072, 106.9706],
  ["Ivory Table", "Gemtel west side", 47.9048, 106.8589],
  ["Copper House", "Naran Tuul east side", 47.9109, 106.9766],
  ["Jade Garden", "3rd school area", 47.9356, 106.9048],
  ["Monarch Lounge", "Peace Avenue west line", 47.9121, 106.8872],
  ["Naran Terrace", "Shar Khad, Bayanzurkh District", 47.9416, 106.9834],
  ["Pearl Bistro", "Gemtel south west road", 47.9006, 106.8548],
  ["Aria Lounge", "Amgalan, Bayanzurkh District", 47.9139, 106.9985],
  ["Tempo Kitchen", "Nisekh, Khan-Uul District", 47.8724, 106.7796],
  ["Breeze Rooftop", "Songino Khairkhan west area", 47.9588, 106.7184],
  ["Onyx Social", "Botanical Garden area, Bayanzurkh District", 47.8427, 107.0846],
  ["Lotus Lounge", "Tolgoit west road", 48.0187, 106.7448],
  ["Prime Table", "Eastern edge, Amgalan Road", 47.8658, 107.1489],
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

const menuTemplate = [
  ["Coffee & Tea", "Signature Americano", "Гашуун амттай шинэхэн кофе", 8500],
  ["Coffee & Tea", "Honey Ginger Tea", "Зөгийн балтай халуун цай", 7500],
  ["Main", "Grilled Chicken Bowl", "Ногоотой тахианы bowl", 28500],
  ["Main", "Beef Tenderloin", "Соус, төмсний нухаштай үхрийн мах", 52000],
  ["Dessert", "Chocolate Lava Cake", "Халуун шоколадтай dessert", 16500],
  ["Drinks", "House Mocktail", "Жимсний signature mocktail", 14500],
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
      data: menuTemplate.map(([category, name, description, price], itemIndex) => ({
        organizationId: organization.id,
        category,
        name,
        description,
        price,
        image: itemIndex % 2 === 0 ? interiorImages[(index + itemIndex) % interiorImages.length] : null,
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

    await prisma.staff.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: `owner${index + 1}@loungebar.mn`,
        },
      },
      update: { password, role: "manager" },
      create: {
        organizationId: organization.id,
        name: `${organization.name} Manager`,
        email: `owner${index + 1}@loungebar.mn`,
        phone: restaurant.phone,
        password,
        role: "manager",
      },
    });
  }

  console.log(`Seeded ${restaurants.length} restaurants with tables, menu items, owners, and admin account.`);
  console.log("Admin: admin@loungebar.mn / Password123!");
  console.log("Owners: owner1@loungebar.mn ... owner30@loungebar.mn / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
