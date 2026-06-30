const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} буруу байна.`);
  return parsed;
}

const DEFAULT_MENU_IMAGE_BY_CATEGORY = {
  Food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80",
  Drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=80",
  Dessert: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80",
  Alcohol: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=900&q=80",
  Snack: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=900&q=80",
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
};

function defaultImageForCategory(category) {
  return DEFAULT_MENU_IMAGE_BY_CATEGORY[category] || DEFAULT_MENU_IMAGE_BY_CATEGORY.Food;
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
      image: payload.image || defaultImageForCategory(payload.category),
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
  if (!data.image && payload.category) data.image = defaultImageForCategory(payload.category);

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
