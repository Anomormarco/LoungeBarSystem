const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const { signToken, verifyPassword } = require("../../utils/auth");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function ownerLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw httpError(400, "Имэйл болон нууц үг шаардлагатай.");
  }

  const staff = await prisma.staff.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      role: "manager",
    },
    include: {
      organization: true,
    },
  });

  if (!staff || !(await verifyPassword(password, staff.password))) {
    throw httpError(401, "Имэйл эсвэл нууц үг буруу байна.");
  }

  const token = signToken({
    type: "owner",
    id: staff.id,
    organizationId: staff.organizationId,
    role: staff.role,
  });

  return {
    token,
    owner: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      organizationId: staff.organizationId,
      organization: staff.organization,
    },
  };
}

async function adminLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw httpError(400, "Имэйл болон нууц үг шаардлагатай.");
  }

  const admin = await prisma.admin.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
  });

  if (!admin || !(await verifyPassword(password, admin.password))) {
    throw httpError(401, "Имэйл эсвэл нууц үг буруу байна.");
  }

  const token = signToken({
    type: "admin",
    id: admin.id,
    role: admin.role,
  });

  return {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}

module.exports = {
  ownerLogin,
  adminLogin,
};
