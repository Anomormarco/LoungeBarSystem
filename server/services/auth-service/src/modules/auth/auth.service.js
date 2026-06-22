const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const { signToken, verifyPassword } = require("../../utils/auth");

async function ownerLogin({ email, password }) {
  if (!email || !password) {
    throw httpError(400, "Email bolon password shaardlagatai");
  }

  const staff = await prisma.staff.findFirst({
    where: {
      email,
      role: "manager",
    },
    include: {
      organization: true,
    },
  });

  if (!staff || !(await verifyPassword(password, staff.password))) {
    throw httpError(401, "Email esvel password buruu baina");
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
  if (!email || !password) {
    throw httpError(400, "Email bolon password shaardlagatai");
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin || !(await verifyPassword(password, admin.password))) {
    throw httpError(401, "Email esvel password buruu baina");
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
