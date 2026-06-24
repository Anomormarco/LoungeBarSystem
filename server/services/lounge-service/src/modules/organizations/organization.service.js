const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getNearbyOrganizations({ lat, lng, radius, q, tableType, availableOnly }) {
  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);
  const radiusKm = toNumber(radius) || 10;
  const radiusMeters = radiusKm * 1000;
  const search = q ? `%${String(q).trim()}%` : null;
  const onlyAvailable = String(availableOnly) === "true";
  const requestedTableType = ["normal", "vip"].includes(tableType) ? tableType : null;

  if (parsedLat === null || parsedLng === null) {
    throw httpError(400, "lat bolon lng query param shaardlagatai");
  }

  return prisma.$queryRaw`
    WITH nearby AS (
      SELECT
        o.id,
        o.name,
        o.description,
        o.address,
        o.latitude,
        o.longitude,
        o.phone,
        o.exterior_images AS "exteriorImages",
        o.interior_images AS "interiorImages",
        o.opening_time AS "openingTime",
        o.closing_time AS "closingTime",
        o.subscription_status AS "subscriptionStatus",
        o.subscription_expiry AS "subscriptionExpiry",
        o.is_approved AS "isApproved",
        o.created_at AS "createdAt",
        (
          6371000 * acos(
            least(
              1,
              greatest(
                -1,
                cos(radians(${parsedLat})) *
                cos(radians(o.latitude::double precision)) *
                cos(radians(o.longitude::double precision) - radians(${parsedLng})) +
                sin(radians(${parsedLat})) *
                sin(radians(o.latitude::double precision))
              )
            )
          )
        ) AS "distanceMeters",
        COUNT(t.id)::int AS "tableCount",
        COUNT(t.id) FILTER (WHERE t.status = 'available')::int AS "availableTableCount",
        COUNT(t.id) FILTER (WHERE t.type = 'vip')::int AS "vipTableCount"
      FROM organizations o
      LEFT JOIN tables t ON t.organization_id = o.id
      WHERE
        o.is_approved = true
        AND o.subscription_status = 'active'
        AND (${search}::text IS NULL OR o.name ILIKE ${search} OR o.address ILIKE ${search})
        AND (${requestedTableType}::"TableType" IS NULL OR EXISTS (
          SELECT 1 FROM tables ft
          WHERE ft.organization_id = o.id AND ft.type = ${requestedTableType}::"TableType"
        ))
        AND (${onlyAvailable}::boolean = false OR EXISTS (
          SELECT 1 FROM tables fa
          WHERE fa.organization_id = o.id AND fa.status = 'available'
        ))
      GROUP BY o.id
    )
    SELECT *
    FROM nearby
    WHERE
      "distanceMeters" <= ${radiusMeters}
    ORDER BY "distanceMeters" ASC
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
