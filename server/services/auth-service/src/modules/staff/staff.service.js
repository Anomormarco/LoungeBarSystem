const bcrypt = require("bcryptjs");
const httpError = require("../../utils/httpError");
const { isGmail, isStrongPassword, passwordRuleMessage } = require("../../utils/validation");
const staffRepository = require("../../repositories/staff.repository");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} буруу байна.`);
  return parsed;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function getOwnerStaff(organizationId) {
  return staffRepository.findByOrganization(organizationId);
}

async function createOwnerStaff(organizationId, payload) {
  const email = normalizeEmail(payload.email);

  if (!payload.name || !email || !payload.role) {
    throw httpError(400, "Нэр, имэйл болон эрх шаардлагатай.");
  }

  if (!isGmail(email)) {
    throw httpError(400, "Имэйл зөвхөн @gmail.com байх ёстой.");
  }

  if (payload.password && !isStrongPassword(payload.password)) {
    throw httpError(400, passwordRuleMessage());
  }

  const password = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;

  return staffRepository.create({
    organizationId,
    name: payload.name,
    phone: payload.phone,
    email,
    password,
    role: payload.role,
  });
}

async function updateOwnerStaff(organizationId, staffId, payload) {
  const id = parseId(staffId, "Ажилтны ID");
  const data = {};

  for (const field of ["name", "phone", "role"]) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (!isGmail(email)) {
      throw httpError(400, "Имэйл зөвхөн @gmail.com байх ёстой.");
    }
    data.email = email;
  }

  if (payload.password) {
    if (!isStrongPassword(payload.password)) {
      throw httpError(400, passwordRuleMessage());
    }
    data.password = await bcrypt.hash(payload.password, 10);
  }

  return staffRepository.updateByOrganization({ id, organizationId, data });
}

async function deleteOwnerStaff(organizationId, staffId) {
  const id = parseId(staffId, "Ажилтны ID");
  return staffRepository.deleteByOrganization({ id, organizationId });
}

async function changeOwnerPassword(user, payload) {
  if (!payload.currentPassword || !payload.newPassword) {
    throw httpError(400, "Одоогийн нууц үг болон шинэ нууц үг шаардлагатай.");
  }

  if (!isStrongPassword(payload.newPassword)) {
    throw httpError(400, passwordRuleMessage());
  }

  const staff = await staffRepository.findOneByUser(user);

  if (!staff || !staff.password) {
    throw httpError(404, "Owner бүртгэл олдсонгүй.");
  }

  const passwordMatches = await bcrypt.compare(payload.currentPassword, staff.password);
  if (!passwordMatches) {
    throw httpError(401, "Одоогийн нууц үг буруу байна.");
  }

  const password = await bcrypt.hash(payload.newPassword, 10);
  await staffRepository.updateById(staff.id, { password });

  return { changed: true };
}

module.exports = {
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
  changeOwnerPassword,
};
