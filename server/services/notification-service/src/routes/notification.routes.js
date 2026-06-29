const express = require("express");
const controller = require("../controllers/notification.controller");

const router = express.Router();

router.get("/health", controller.health);
router.post("/internal/emit", controller.emitInternal);

module.exports = router;
