const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const bcrypt = require("bcryptjs");
const { isGmail, isStrongPassword, passwordRuleMessage } = require("../../utils/validation");

function parseOrganizationId(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Байгууллагын ID буруу байна.");
  }

  return organizationId;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
    include: {
      staff: {
        where: { role: "manager" },
        select: { id: true, name: true, email: true, phone: true, role: true },
        take: 1,
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          planType: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          paymentStatus: true,
          paidAt: true,
          periodEnd: true,
          stripeCheckoutSessionId: true,
        },
      },
    },
  });
}

async function createOrganization(payload) {
  const data = organizationData(payload);

  if (!data.name || !data.address || data.latitude === undefined || data.longitude === undefined || !data.openingTime || !data.closingTime) {
    throw httpError(400, "Нэр, хаяг, latitude, longitude, нээх цаг, хаах цаг шаардлагатай.");
  }

  const ownerEmail = normalizeEmail(payload.ownerEmail);

  if (!payload.ownerName || !ownerEmail || !payload.ownerPassword) {
    throw httpError(400, "Owner нэр, имэйл болон анхны нууц үг шаардлагатай.");
  }

  if (!isGmail(ownerEmail)) {
    throw httpError(400, "Owner имэйл зөвхөн @gmail.com байх ёстой.");
  }

  if (!isStrongPassword(payload.ownerPassword)) {
    throw httpError(400, passwordRuleMessage());
  }

  const existingOwner = await prisma.staff.findFirst({
    where: {
      email: ownerEmail,
      role: "manager",
    },
  });

  if (existingOwner) {
    throw httpError(409, "Энэ owner имэйл аль хэдийн бүртгэлтэй байна.");
  }

  const password = await bcrypt.hash(payload.ownerPassword, 10);

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data });

    const owner = await tx.staff.create({
      data: {
        organizationId: organization.id,
        name: String(payload.ownerName).trim(),
        phone: payload.ownerPhone || payload.phone || null,
        email: ownerEmail,
        password,
        role: "manager",
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return {
      ...organization,
      staff: [owner],
    };
  });
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
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionExpiry: true },
  });
  const nextExpiry =
    organization?.subscriptionExpiry && new Date(organization.subscriptionExpiry).getTime() > Date.now()
      ? organization.subscriptionExpiry
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      isApproved: true,
      subscriptionStatus: "active",
      subscriptionExpiry: nextExpiry,
    },
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
