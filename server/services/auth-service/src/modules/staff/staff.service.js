const bcrypt = require("bcryptjs");
const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} buruu baina`);
  return parsed;
}

async function getOwnerStaff(organizationId) {
  return prisma.staff.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

async function createOwnerStaff(organizationId, payload) {
  if (!payload.name || !payload.email || !payload.role) {
    throw httpError(400, "Ner, email bolon erh shaardlagatai");
  }

  const password = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;

  return prisma.staff.create({
    data: {
      organizationId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      password,
      role: payload.role,
    },
  });
}

async function updateOwnerStaff(organizationId, staffId, payload) {
  const id = parseId(staffId, "Ajiltnii id");
  const data = {};

  for (const field of ["name", "phone", "email", "role"]) {
    if (payload[field] !== undefined) data[field] = payload[field];
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

module.exports = {
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
};
