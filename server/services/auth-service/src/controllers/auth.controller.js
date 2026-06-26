const { ownerLogin, adminLogin, getAdminStatistics } = require("../modules/auth/auth.service");
const {
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
  changeOwnerPassword,
} = require("../modules/staff/staff.service");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function loginOwner(req, res) {
  const data = await ownerLogin(req.body);
  res.json({ data });
}

async function loginAdmin(req, res) {
  const data = await adminLogin(req.body);
  res.json({ data });
}

async function updateOwnerPassword(req, res) {
  const data = await changeOwnerPassword(req.user, req.body);
  res.json({ data });
}

async function listOwnerStaff(req, res) {
  const data = await getOwnerStaff(req.user.organizationId);
  res.json({ data });
}

async function addOwnerStaff(req, res) {
  const data = await createOwnerStaff(req.user.organizationId, req.body);
  res.status(201).json({ data });
}

async function editOwnerStaff(req, res) {
  const data = await updateOwnerStaff(req.user.organizationId, req.params.id, req.body);
  res.json({ data });
}

async function removeOwnerStaff(req, res) {
  const data = await deleteOwnerStaff(req.user.organizationId, req.params.id);
  res.json({ data });
}

async function adminStatistics(req, res) {
  const data = await getAdminStatistics();
  res.json({ data });
}

module.exports = {
  loginOwner: asyncHandler(loginOwner),
  loginAdmin: asyncHandler(loginAdmin),
  updateOwnerPassword: asyncHandler(updateOwnerPassword),
  listOwnerStaff: asyncHandler(listOwnerStaff),
  addOwnerStaff: asyncHandler(addOwnerStaff),
  editOwnerStaff: asyncHandler(editOwnerStaff),
  removeOwnerStaff: asyncHandler(removeOwnerStaff),
  adminStatistics: asyncHandler(adminStatistics),
};

