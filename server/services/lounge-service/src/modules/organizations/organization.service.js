const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getNearbyOrganizations({ lat, lng, radius }) {
  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);
  const radiusKm = toNumber(radius) || 10;
  const radiusMeters = radiusKm * 1000;

  if (parsedLat === null || parsedLng === null) {
    throw httpError(400, "lat bolon lng query param shaardlagatai");
  }

  return prisma.$queryRaw`
    SELECT
      id,
      name,
      description,
      address,
      latitude,
      longitude,
      phone,
      exterior_images AS exteriorImages,
      interior_images AS interiorImages,
      opening_time AS openingTime,
      closing_time AS closingTime,
      subscription_status AS subscriptionStatus,
      subscription_expiry AS subscriptionExpiry,
      is_approved AS isApproved,
      created_at AS createdAt,
      ST_Distance_Sphere(POINT(longitude, latitude), POINT(${parsedLng}, ${parsedLat})) AS distanceMeters
    FROM organizations
    WHERE
      is_approved = true
      AND subscription_status = 'active'
      AND ST_Distance_Sphere(POINT(longitude, latitude), POINT(${parsedLng}, ${parsedLat})) <= ${radiusMeters}
    ORDER BY distanceMeters ASC
    LIMIT 50
  `;
}

async function getOrganizationDetail(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Baiguullagiin id buruu baina");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
      tables: {
        orderBy: { tableNumber: "asc" },
      },
    },
  });

  if (!organization) {
    throw httpError(404, "Baiguullaga oldsongui");
  }

  return organization;
}

module.exports = {
  getNearbyOrganizations,
  getOrganizationDetail,
};
