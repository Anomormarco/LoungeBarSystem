const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function normalizeImages(value, label) {
  if (value === undefined) return undefined;

  const images = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n/)
        .map((item) => item.trim());

  const cleanImages = images.filter(Boolean);

  if (cleanImages.length > 12) {
    throw httpError(400, `${label} зураг 12-оос их байж болохгүй.`);
  }

  for (const image of cleanImages) {
    try {
      const url = new URL(image);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch (error) {
      throw httpError(400, `${label} зурагны URL буруу байна: ${image}`);
    }
  }

  return cleanImages;
}

function selectOrganization() {
  return {
    id: true,
    name: true,
    description: true,
    address: true,
    phone: true,
    exteriorImages: true,
    interiorImages: true,
    openingTime: true,
    closingTime: true,
  };
}

async function getOwnerOrganization(organizationId) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: selectOrganization(),
  });

  if (!organization) {
    throw httpError(404, "Байгууллага олдсонгүй.");
  }

  return organization;
}

async function updateOwnerOrganization(organizationId, payload) {
  const data = {};
  const exteriorImages = normalizeImages(payload.exteriorImages, "Exterior");
  const interiorImages = normalizeImages(payload.interiorImages, "Interior");

  if (exteriorImages !== undefined) data.exteriorImages = exteriorImages;
  if (interiorImages !== undefined) data.interiorImages = interiorImages;

  if (payload.description !== undefined) data.description = String(payload.description || "").trim() || null;
  if (payload.phone !== undefined) data.phone = String(payload.phone || "").trim() || null;

  return prisma.organization.update({
    where: { id: organizationId },
    data,
    select: selectOrganization(),
  });
}

module.exports = {
  getOwnerOrganization,
  updateOwnerOrganization,
};
