const httpError = require("../../utils/httpError");
const organizationRepository = require("../../repositories/organization.repository");
const cache = require("../../utils/cache");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, "\\$&");
}

async function getNearbyOrganizations({ lat, lng, radius, q, tableType, availableOnly }) {
  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);
  const radiusKm = toNumber(radius) || 10;
  const radiusMeters = radiusKm * 1000;
  const searchText = String(q || "").trim();
  const search = searchText ? `%${escapeLikePattern(searchText)}%` : null;
  const onlyAvailable = String(availableOnly) === "true";
  const requestedTableType = ["normal", "vip"].includes(tableType) ? tableType : null;

  if (parsedLat === null || parsedLng === null) {
    throw httpError(400, "lat болон lng query параметр шаардлагатай.");
  }

  const cacheKey = [
    "nearby",
    parsedLat.toFixed(5),
    parsedLng.toFixed(5),
    radiusKm,
    search || "",
    requestedTableType || "",
    onlyAvailable,
  ].join(":");

  return cache.remember(cacheKey, () => organizationRepository.findNearby({
    parsedLat,
    parsedLng,
    radiusMeters,
    search,
    requestedTableType,
    onlyAvailable,
  }));
}

async function getOrganizationDetail(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Байгууллагын ID буруу байна.");
  }

  const organization = await cache.remember(
    `organization:${organizationId}`,
    () => organizationRepository.findDetail(organizationId)
  );

  if (!organization) {
    throw httpError(404, "Байгууллага олдсонгүй.");
  }

  return organization;
}

module.exports = {
  getNearbyOrganizations,
  getOrganizationDetail,
};
