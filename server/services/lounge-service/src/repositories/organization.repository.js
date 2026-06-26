const prisma = require("../utils/prisma");

function findNearby({ parsedLat, parsedLng, radiusMeters, search, requestedTableType, onlyAvailable }) {
  return prisma.$read.$queryRaw`
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

function findDetail(id) {
  return prisma.$read.organization.findUnique({
    where: { id },
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
}

module.exports = {
  findNearby,
  findDetail,
};
