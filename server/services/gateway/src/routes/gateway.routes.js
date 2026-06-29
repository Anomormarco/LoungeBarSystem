const express = require("express");
const healthController = require("../controllers/health.controller");
const serviceUrls = require("../config/serviceUrls");
const { serviceProxy, socketProxy } = require("../services/proxy.service");

const router = express.Router();

router.get("/health", healthController.health);

router.use("/socket.io", socketProxy(serviceUrls.notification));

router.use("/owner/login", serviceProxy(serviceUrls.auth));
router.use("/owner/password", serviceProxy(serviceUrls.auth));
router.use("/owner/staff", serviceProxy(serviceUrls.auth));
router.use("/admin/login", serviceProxy(serviceUrls.auth));
router.use("/admin/statistics", serviceProxy(serviceUrls.auth));

router.use("/organizations", serviceProxy(serviceUrls.lounge));
router.use("/owner/tables", serviceProxy(serviceUrls.lounge));
router.use("/owner/menu-items", serviceProxy(serviceUrls.lounge));
router.use("/admin/organizations", serviceProxy(serviceUrls.lounge));

router.use("/reservations", serviceProxy(serviceUrls.reservation));
router.use("/owner/reservations", serviceProxy(serviceUrls.reservation));
router.use("/owner/statistics", serviceProxy(serviceUrls.reservation));

router.use("/payments", serviceProxy(serviceUrls.payment));
router.use("/owner/subscription", serviceProxy(serviceUrls.payment));

router.use("/notifications", serviceProxy(serviceUrls.notification));

module.exports = router;
