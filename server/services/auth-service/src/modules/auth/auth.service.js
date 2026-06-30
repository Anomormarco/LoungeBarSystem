const httpError = require("../../utils/httpError");
const bcrypt = require("bcryptjs");
const { signToken, verifyPassword } = require("../../utils/auth");
const { isGmail, isStrongPassword, passwordRuleMessage } = require("../../utils/validation");
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

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function ownerRegister(payload) {
  const ownerName = normalizeText(payload.ownerName || payload.name);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const phone = normalizePhone(payload.phone);
  const organizationName = normalizeText(payload.organizationName);
  const address = normalizeText(payload.address);
  const latitude = Number(payload.latitude || 47.9184);
  const longitude = Number(payload.longitude || 106.9177);

  if (!ownerName || !email || !password || !organizationName || !address) {
    throw httpError(400, "Owner нэр, имэйл, нууц үг, байгууллагын нэр болон хаяг шаардлагатай.");
  }

  if (!isGmail(email)) {
    throw httpError(400, "Owner имэйл зөвхөн @gmail.com байх ёстой.");
  }

  if (!isStrongPassword(password)) {
    throw httpError(400, passwordRuleMessage());
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw httpError(400, "Байршлын latitude/longitude буруу байна.");
  }

  const existingStaff = await authRepository.findStaffByEmail(email);
  if (existingStaff) {
    throw httpError(409, "Энэ имэйлээр owner бүртгэл аль хэдийн үүссэн байна.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const staff = await authRepository.createOwnerOrganization({
    organization: {
      name: organizationName,
      description: normalizeText(payload.description) || `${organizationName} байгууллагын owner self registration.`,
      address,
      latitude,
      longitude,
      phone: phone || null,
      openingTime: normalizeText(payload.openingTime) || "10:00",
      closingTime: normalizeText(payload.closingTime) || "23:00",
      subscriptionStatus: "expired",
      isApproved: true,
      exteriorImages: [],
      interiorImages: [],
    },
    owner: {
      name: ownerName,
      email,
      phone: phone || null,
      password: hashedPassword,
    },
  });

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
  ownerRegister,
  adminLogin,
  getAdminStatistics,
};
