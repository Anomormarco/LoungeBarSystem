const express = require("express");
const controller = require("../controllers/auth.controller");
const { ownerGuard, ownerActiveGuard, adminGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/owner/login", controller.loginOwner);
router.put("/owner/password", ownerGuard, controller.updateOwnerPassword);

router.get("/owner/staff", ownerActiveGuard, controller.listOwnerStaff);
router.post("/owner/staff", ownerActiveGuard, controller.addOwnerStaff);
router.put("/owner/staff/:id", ownerActiveGuard, controller.editOwnerStaff);
router.delete("/owner/staff/:id", ownerActiveGuard, controller.removeOwnerStaff);

router.post("/admin/login", controller.loginAdmin);
router.get("/admin/statistics", adminGuard, controller.adminStatistics);

module.exports = router;
