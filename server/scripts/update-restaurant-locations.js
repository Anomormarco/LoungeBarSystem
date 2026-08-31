require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { createPrismaPgAdapter } = require("./prismaAdapter");

const adapter = createPrismaPgAdapter(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const locations = [
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
  ["Copper House", "Sansar / Bayanzurkh west", 47.9255, 106.947],
  ["Jade Garden", "13th district / Bayanzurkh", 47.913, 106.9482],
  ["Monarch Lounge", "Bayanzurkh tovchoo road", 47.909, 106.988],
  ["Naran Terrace", "Amgalan / east Ulaanbaatar", 47.9178, 107.018],
  ["Pearl Bistro", "Uliastai / east valley", 47.9008, 107.06],
  ["Aria Lounge", "National Park / south-east city", 47.8836, 106.985],
  ["Tempo Kitchen", "Hunnu Mall south / Khan-Uul", 47.894, 106.879],
  ["Breeze Rooftop", "Dunjingarav / Bayanzurkh north-east", 47.948, 106.965],
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  let updated = 0;
  for (const [name, address, latitude, longitude] of locations) {
    const result = await prisma.organization.updateMany({
      where: { name },
      data: { address, latitude, longitude },
    });
    updated += result.count;
  }

  console.log(`Updated ${updated} restaurant locations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
