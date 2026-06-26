const organizationService = require("../modules/organizations/organization.service");
const tableService = require("../modules/tables/table.service");
const menuService = require("../modules/menu/menu.service");
const ownerTableService = require("../modules/tables/owner-table.service");
const ownerMenuService = require("../modules/menu/owner-menu.service");
const adminOrganizationService = require("../modules/admin/admin-organization.service");
const cache = require("../utils/cache");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function clearPublicCache() {
  cache.clearByPrefix("nearby:");
  cache.clearByPrefix("organization:");
}

async function nearbyOrganizations(req, res) {
  const data = await organizationService.getNearbyOrganizations(req.query);
  res.json({ data });
}

async function organizationDetail(req, res) {
  const data = await organizationService.getOrganizationDetail(req.params.id);
  res.json({ data });
}

async function organizationTables(req, res) {
  const data = await tableService.getOrganizationTables(req.params.id);
  res.json({ data });
}

async function organizationMenu(req, res) {
  const data = await menuService.getOrganizationMenu(req.params.id);
  res.json({ data });
}

async function ownerTables(req, res) {
  const data = await ownerTableService.getOwnerTables(req.user.organizationId);
  res.json({ data });
}

async function createOwnerTable(req, res) {
  const data = await ownerTableService.createOwnerTable(req.user.organizationId, req.body);
  clearPublicCache();
  res.status(201).json({ data });
}

async function updateOwnerTable(req, res) {
  const data = await ownerTableService.updateOwnerTable(req.user.organizationId, req.params.id, req.body);
  clearPublicCache();
  res.json({ data });
}

async function deleteOwnerTable(req, res) {
  const data = await ownerTableService.deleteOwnerTable(req.user.organizationId, req.params.id);
  clearPublicCache();
  res.json({ data });
}

async function ownerMenuItems(req, res) {
  const data = await ownerMenuService.getOwnerMenuItems(req.user.organizationId);
  res.json({ data });
}

async function createOwnerMenuItem(req, res) {
  const data = await ownerMenuService.createOwnerMenuItem(req.user.organizationId, req.body);
  clearPublicCache();
  res.status(201).json({ data });
}

async function updateOwnerMenuItem(req, res) {
  const data = await ownerMenuService.updateOwnerMenuItem(req.user.organizationId, req.params.id, req.body);
  clearPublicCache();
  res.json({ data });
}

async function deleteOwnerMenuItem(req, res) {
  const data = await ownerMenuService.deleteOwnerMenuItem(req.user.organizationId, req.params.id);
  clearPublicCache();
  res.json({ data });
}

async function adminOrganizations(req, res) {
  const data = await adminOrganizationService.getOrganizations();
  res.json({ data });
}

async function createAdminOrganization(req, res) {
  const data = await adminOrganizationService.createOrganization(req.body);
  clearPublicCache();
  res.status(201).json({ data });
}

async function updateAdminOrganization(req, res) {
  const data = await adminOrganizationService.updateOrganization(req.params.id, req.body);
  clearPublicCache();
  res.json({ data });
}

async function deleteAdminOrganization(req, res) {
  const data = await adminOrganizationService.deleteOrganization(req.params.id);
  clearPublicCache();
  res.json({ data });
}

async function approveAdminOrganization(req, res) {
  const data = await adminOrganizationService.approveOrganization(req.params.id);
  clearPublicCache();
  res.json({ data });
}

async function disableAdminOrganization(req, res) {
  const data = await adminOrganizationService.disableOrganization(req.params.id);
  clearPublicCache();
  res.json({ data });
}

module.exports = {
  nearbyOrganizations: asyncHandler(nearbyOrganizations),
  organizationDetail: asyncHandler(organizationDetail),
  organizationTables: asyncHandler(organizationTables),
  organizationMenu: asyncHandler(organizationMenu),
  ownerTables: asyncHandler(ownerTables),
  createOwnerTable: asyncHandler(createOwnerTable),
  updateOwnerTable: asyncHandler(updateOwnerTable),
  deleteOwnerTable: asyncHandler(deleteOwnerTable),
  ownerMenuItems: asyncHandler(ownerMenuItems),
  createOwnerMenuItem: asyncHandler(createOwnerMenuItem),
  updateOwnerMenuItem: asyncHandler(updateOwnerMenuItem),
  deleteOwnerMenuItem: asyncHandler(deleteOwnerMenuItem),
  adminOrganizations: asyncHandler(adminOrganizations),
  createAdminOrganization: asyncHandler(createAdminOrganization),
  updateAdminOrganization: asyncHandler(updateAdminOrganization),
  deleteAdminOrganization: asyncHandler(deleteAdminOrganization),
  approveAdminOrganization: asyncHandler(approveAdminOrganization),
  disableAdminOrganization: asyncHandler(disableAdminOrganization),
};
