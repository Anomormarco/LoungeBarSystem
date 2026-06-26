const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} буруу байна.`);
  return parsed;
}

async function getOwnerMenuItems(organizationId) {
  return prisma.menuItem.findMany({
    where: { organizationId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

async function createOwnerMenuItem(organizationId, payload) {
  const price = Number(payload.price);

  if (!payload.category || !payload.name || !Number.isFinite(price)) {
    throw httpError(400, "Ангилал, нэр болон үнэ шаардлагатай.");
  }

  return prisma.menuItem.create({
    data: {
      organizationId,
      category: payload.category,
      name: payload.name,
      description: payload.description,
      price,
      image: payload.image,
      isAvailable: payload.isAvailable ?? true,
    },
  });
}

async function updateOwnerMenuItem(organizationId, menuItemId, payload) {
  const id = parseId(menuItemId, "Меню item ID");
  const data = {};

  for (const field of ["category", "name", "description", "image", "isAvailable"]) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  if (payload.price !== undefined) data.price = Number(payload.price);

  return prisma.menuItem.update({
    where: {
      id,
      organizationId,
    },
    data,
  });
}

async function deleteOwnerMenuItem(organizationId, menuItemId) {
  const id = parseId(menuItemId, "Меню item ID");

  await prisma.menuItem.delete({
    where: {
      id,
      organizationId,
    },
  });

  return { id };
}

module.exports = {
  getOwnerMenuItems,
  createOwnerMenuItem,
  updateOwnerMenuItem,
  deleteOwnerMenuItem,
};
