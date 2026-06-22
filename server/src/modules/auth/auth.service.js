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

module.exports = {
  ownerLogin,
};
