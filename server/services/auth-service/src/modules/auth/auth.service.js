const httpError = require("../../utils/httpError");
const { signToken, verifyPassword } = require("../../utils/auth");
const { isGmail } = require("../../utils/validation");
const authRepository = require("../../repositories/auth.repository");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function ownerLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw httpError(400, "Имэйл болон нууц үг шаардлагатай.");
  }

  if (!isGmail(normalizedEmail)) {
    throw httpError(400, "Owner имэйл зөвхөн @gmail.com байх ёстой.");
  }

  const staff = await authRepository.findManagerByEmail(normalizedEmail);

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

  const admin = await authRepository.findAdminByEmail(normalizedEmail);

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

async function getAdminStatistics() {
  const [totalOrganizations, activeSubscriptions, totalReservations, cancelledReservations] =
    await authRepository.getAdminStatistics();

  return {
    totalOrganizations,
    activeSubscriptions,
    totalReservations,
    cancelledReservations,
  };
}

module.exports = {
  ownerLogin,
  adminLogin,
  getAdminStatistics,
};
