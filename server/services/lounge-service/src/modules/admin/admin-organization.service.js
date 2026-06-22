const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function parseOrganizationId(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Baiguullagiin id buruu baina");
  }

  return organizationId;
}

function organizationData(payload) {
  const data = {};
  const fields = [
    "name",
    "description",
    "address",
    "latitude",
    "longitude",
    "phone",
    "exteriorImages",
    "interiorImages",
    "openingTime",
    "closingTime",
    "subscriptionStatus",
    "subscriptionExpiry",
    "isApproved",
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  }

  if (data.latitude !== undefined) data.latitude = Number(data.latitude);
  if (data.longitude !== undefined) data.longitude = Number(data.longitude);
  if (data.subscriptionExpiry) data.subscriptionExpiry = new Date(data.subscriptionExpiry);

  return data;
}

async function getOrganizations() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
  });
}

async function createOrganization(payload) {
  const data = organizationData(payload);

  if (!data.name || !data.address || data.latitude === undefined || data.longitude === undefined || !data.openingTime || !data.closingTime) {
    throw httpError(400, "Ner, hayag, latitude, longitude, neeh tsag, haah tsag shaardlagatai");
  }

  return prisma.organization.create({ data });
}

async function updateOrganization(id, payload) {
  const organizationId = parseOrganizationId(id);

  return prisma.organization.update({
    where: { id: organizationId },
    data: organizationData(payload),
  });
}

async function deleteOrganization(id) {
  const organizationId = parseOrganizationId(id);

  await prisma.organization.delete({
    where: { id: organizationId },
  });

  return { id: organizationId };
}

async function approveOrganization(id) {
  const organizationId = parseOrganizationId(id);

  return prisma.organization.update({
    where: { id: organizationId },
    data: { isApproved: true },
  });
}

async function disableOrganization(id) {
  const organizationId = parseOrganizationId(id);

  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: "disabled",
      isApproved: false,
    },
  });
}

module.exports = {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  approveOrganization,
  disableOrganization,
};
