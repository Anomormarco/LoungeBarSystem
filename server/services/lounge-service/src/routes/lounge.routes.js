const express = require("express");
const controller = require("../controllers/lounge.controller");
const { ownerActiveGuard, adminGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/organizations/nearby", controller.nearbyOrganizations);
router.get("/organizations/:id", controller.organizationDetail);
router.get("/organizations/:id/tables", controller.organizationTables);
router.get("/organizations/:id/menu", controller.organizationMenu);

router.get("/owner/tables", ownerActiveGuard, controller.ownerTables);
router.post("/owner/tables", ownerActiveGuard, controller.createOwnerTable);
router.put("/owner/tables/:id", ownerActiveGuard, controller.updateOwnerTable);
router.delete("/owner/tables/:id", ownerActiveGuard, controller.deleteOwnerTable);

router.get("/owner/menu-items", ownerActiveGuard, controller.ownerMenuItems);
router.post("/owner/menu-items", ownerActiveGuard, controller.createOwnerMenuItem);
router.put("/owner/menu-items/:id", ownerActiveGuard, controller.updateOwnerMenuItem);
router.delete("/owner/menu-items/:id", ownerActiveGuard, controller.deleteOwnerMenuItem);

router.get("/admin/organizations", adminGuard, controller.adminOrganizations);
router.post("/admin/organizations", adminGuard, controller.createAdminOrganization);
router.put("/admin/organizations/:id", adminGuard, controller.updateAdminOrganization);
router.delete("/admin/organizations/:id", adminGuard, controller.deleteAdminOrganization);
router.put("/admin/organizations/:id/approve", adminGuard, controller.approveAdminOrganization);
router.put("/admin/organizations/:id/disable", adminGuard, controller.disableAdminOrganization);

module.exports = router;
