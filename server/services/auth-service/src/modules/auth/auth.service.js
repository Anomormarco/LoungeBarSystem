const httpError = require("../../utils/httpError");
const bcrypt = require("bcryptjs");
const { signToken, verifyPassword } = require("../../utils/auth");
const { isGmail, isStrongPassword, passwordRuleMessage } = require("../../utils/validation");
const authRepository = require("../../repositories/auth.repository");

const SEED_OWNER_PASSWORD = "Password123!";
const SEED_OWNER_ORGANIZATIONS = [
  "Skyline Lounge",
  "Noir Social Club",
  "Velvet Room",
  "Amber Terrace",
  "Mellow Garden",
  "The Brass Bar",
  "Aurora Lounge",
  "Nomad Table",
  "Crown & Smoke",
  "Saffron Rooftop",
  "Luna Bistro",
  "Echo Lounge",
  "Golden Hour",
  "Urban Flame",
  "Opal Room",
  "Mint Social",
  "Horizon Grill",
  "Cedar Lounge",
  "Ivory Table",
  "Copper House",
  "Jade Garden",
  "Monarch Lounge",
  "Naran Terrace",
  "Pearl Bistro",
  "Aria Lounge",
  "Tempo Kitchen",
  "Breeze Rooftop",
  "Onyx Social",
  "Lotus Lounge",
  "Prime Table",
];

function seedOwnerNumber(email) {
  const match = /^owner([1-9]|[12][0-9]|30)@gmail\.com$/i.exec(email);
  return match ? Number(match[1]) : null;
}

function legacySeedOwnerEmail(ownerNumber) {
  return `owner${ownerNumber}@loungebar.mn`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function restoreSeedOwner({ ownerNumber, email, password }) {
  if (!ownerNumber || password !== SEED_OWNER_PASSWORD) {
    return null;
  }

  const organizationName = SEED_OWNER_ORGANIZATIONS[ownerNumber - 1];
  if (!organizationName) {
    return null;
  }

  const organization = await authRepository.findOrganizationByName(organizationName);
  if (!organization) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(SEED_OWNER_PASSWORD, 10);
  return authRepository.createManagerStaff({
    organizationId: organization.id,
    name: `${organization.name} Manager`,
    email,
    phone: organization.phone || null,
    password: hashedPassword,
  });
}

async function ownerLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw httpError(400, "Имэйл болон нууц үг шаардлагатай.");
  }

  if (!isGmail(normalizedEmail)) {
    throw httpError(400, "Owner имэйл зөвхөн @gmail.com байх ёстой.");
  }

  let staff = await authRepository.findManagerByEmail(normalizedEmail);
  const ownerNumber = seedOwnerNumber(normalizedEmail);

  if (!staff && ownerNumber) {
    const legacyStaff = await authRepository.findManagerByEmail(legacySeedOwnerEmail(ownerNumber));

    if (legacyStaff && password === SEED_OWNER_PASSWORD) {
      staff = await authRepository.updateStaffById(legacyStaff.id, {
        email: normalizedEmail,
        password: await bcrypt.hash(SEED_OWNER_PASSWORD, 10),
        role: "manager",
      });
    }

    if (!staff) {
      staff = await restoreSeedOwner({ ownerNumber, email: normalizedEmail, password });
    }
  }

  if (staff && ownerNumber && password === SEED_OWNER_PASSWORD && !(await verifyPassword(password, staff.password))) {
    staff = await authRepository.updateStaffById(staff.id, {
      password: await bcrypt.hash(SEED_OWNER_PASSWORD, 10),
      role: "manager",
    });
  }

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
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const address = normalizeText(payload.address) ||
    (Number.isFinite(latitude) && Number.isFinite(longitude)
      ? `Map location ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      : "");
  const openingTime = normalizeText(payload.openingTime);
  const closingTime = normalizeText(payload.closingTime);

  if (!ownerName || !email || !password || !organizationName || !address || !openingTime || !closingTime) {
    const missingFields = [
      !ownerName && "Owner нэр",
      !email && "имэйл",
      !password && "нууц үг",
      !organizationName && "байгууллагын нэр",
      !address && "хаяг",
      !openingTime && "нээх цаг",
      !closingTime && "хаах цаг",
    ].filter(Boolean);
    throw httpError(400, `${missingFields.join(", ")} шаардлагатай.`);
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
      openingTime,
      closingTime,
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
