const bcrypt = require("bcryptjs");
const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} buruu baina`);
  return parsed;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function getOwnerStaff(organizationId) {
  return prisma.staff.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

async function createOwnerStaff(organizationId, payload) {
  const email = normalizeEmail(payload.email);

  if (!payload.name || !email || !payload.role) {
    throw httpError(400, "Ner, email bolon erh shaardlagatai");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, "Email buruu baina");
  }

  const password = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;

  return prisma.staff.create({
    data: {
      organizationId,
      name: payload.name,
      phone: payload.phone,
      email,
      password,
      role: payload.role,
    },
  });
}

async function updateOwnerStaff(organizationId, staffId, payload) {
  const id = parseId(staffId, "Ajiltnii id");
  const data = {};

  for (const field of ["name", "phone", "role"]) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, "Email buruu baina");
    }
    data.email = email;
  }

  if (payload.password) data.password = await bcrypt.hash(payload.password, 10);

  return prisma.staff.update({
    where: {
      id,
      organizationId,
    },
    data,
  });
}

async function deleteOwnerStaff(organizationId, staffId) {
  const id = parseId(staffId, "Ajiltnii id");

  await prisma.staff.delete({
    where: {
      id,
      organizationId,
    },
  });

  return { id };
}

async function changeOwnerPassword(user, payload) {
  if (!payload.currentPassword || !payload.newPassword) {
    throw httpError(400, "Odoogiin password bolon shine password shaardlagatai");
  }

  if (String(payload.newPassword).length < 8) {
    throw httpError(400, "Shine password 8 temdegt ees urt baih yostoi");
  }

  const staff = await prisma.staff.findFirst({
    where: {
      id: user.id,
      organizationId: user.organizationId,
    },
  });

  if (!staff || !staff.password) {
    throw httpError(404, "Owner burtgel oldsongui");
  }

  const passwordMatches = await bcrypt.compare(payload.currentPassword, staff.password);
  if (!passwordMatches) {
    throw httpError(401, "Odoogiin password buruu baina");
  }

  const password = await bcrypt.hash(payload.newPassword, 10);
  await prisma.staff.update({
    where: { id: staff.id },
    data: { password },
  });

  return { changed: true };
}

module.exports = {
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
  changeOwnerPassword,
};
