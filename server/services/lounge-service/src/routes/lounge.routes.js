const express = require("express");
const {
  getNearbyOrganizations,
  getOrganizationDetail,
} = require("../modules/organizations/organization.service");
const { getOrganizationTables } = require("../modules/tables/table.service");
const { getOrganizationMenu } = require("../modules/menu/menu.service");
const {
  getOwnerTables,
  createOwnerTable,
  updateOwnerTable,
  deleteOwnerTable,
} = require("../modules/tables/owner-table.service");
const {
  getOwnerMenuItems,
  createOwnerMenuItem,
  updateOwnerMenuItem,
  deleteOwnerMenuItem,
} = require("../modules/menu/owner-menu.service");
const {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  approveOrganization,
  disableOrganization,
} = require("../modules/admin/admin-organization.service");
const { ownerActiveGuard, adminGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public Lounge APIs
router.get("/organizations/nearby", async (req, res, next) => {
  try {
    const organizations = await getNearbyOrganizations(req.query);
    res.json({ data: organizations });
  } catch (error) {
    next(error);
  }
});

router.get("/organizations/:id", async (req, res, next) => {
  try {
    const organization = await getOrganizationDetail(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.get("/organizations/:id/tables", async (req, res, next) => {
  try {
    const tables = await getOrganizationTables(req.params.id);
    res.json({ data: tables });
  } catch (error) {
    next(error);
  }
});

router.get("/organizations/:id/menu", async (req, res, next) => {
  try {
    const menuItems = await getOrganizationMenu(req.params.id);
    res.json({ data: menuItems });
  } catch (error) {
    next(error);
  }
});

// Owner Table Management APIs
router.get("/owner/tables", ownerActiveGuard, async (req, res, next) => {
  try {
    const tables = await getOwnerTables(req.user.organizationId);
    res.json({ data: tables });
  } catch (error) {
    next(error);
  }
});

router.post("/owner/tables", ownerActiveGuard, async (req, res, next) => {
  try {
    const table = await createOwnerTable(req.user.organizationId, req.body);
    res.status(201).json({ data: table });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/tables/:id", ownerActiveGuard, async (req, res, next) => {
  try {
    const table = await updateOwnerTable(req.user.organizationId, req.params.id, req.body);
    res.json({ data: table });
  } catch (error) {
    next(error);
  }
});

router.delete("/owner/tables/:id", ownerActiveGuard, async (req, res, next) => {
  try {
    const table = await deleteOwnerTable(req.user.organizationId, req.params.id);
    res.json({ data: table });
  } catch (error) {
    next(error);
  }
});

// Owner Menu Item Management APIs
router.get("/owner/menu-items", ownerActiveGuard, async (req, res, next) => {
  try {
    const menuItems = await getOwnerMenuItems(req.user.organizationId);
    res.json({ data: menuItems });
  } catch (error) {
    next(error);
  }
});

router.post("/owner/menu-items", ownerActiveGuard, async (req, res, next) => {
  try {
    const menuItem = await createOwnerMenuItem(req.user.organizationId, req.body);
    res.status(201).json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/menu-items/:id", ownerActiveGuard, async (req, res, next) => {
  try {
    const menuItem = await updateOwnerMenuItem(req.user.organizationId, req.params.id, req.body);
    res.json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.delete("/owner/menu-items/:id", ownerActiveGuard, async (req, res, next) => {
  try {
    const menuItem = await deleteOwnerMenuItem(req.user.organizationId, req.params.id);
    res.json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

// Admin Organization Management APIs
router.get("/admin/organizations", adminGuard, async (req, res, next) => {
  try {
    const organizations = await getOrganizations();
    res.json({ data: organizations });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/organizations", adminGuard, async (req, res, next) => {
  try {
    const organization = await createOrganization(req.body);
    res.status(201).json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/admin/organizations/:id", adminGuard, async (req, res, next) => {
  try {
    const organization = await updateOrganization(req.params.id, req.body);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/organizations/:id", adminGuard, async (req, res, next) => {
  try {
    const organization = await deleteOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/admin/organizations/:id/approve", adminGuard, async (req, res, next) => {
  try {
    const organization = await approveOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/admin/organizations/:id/disable", adminGuard, async (req, res, next) => {
  try {
    const organization = await disableOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
