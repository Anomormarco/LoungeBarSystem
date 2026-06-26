const express = require("express");
const controller = require("../controllers/reservation.controller");
const { ownerActiveGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/reservations/send-otp", controller.sendOtp);
router.post("/reservations/verify-otp", controller.verifyOtp);
router.post("/reservations", controller.createReservation);

router.get("/owner/reservations", ownerActiveGuard, controller.ownerReservations);
router.put("/owner/reservations/:id/confirm", ownerActiveGuard, controller.confirmOwnerReservation);
router.put("/owner/reservations/:id/cancel", ownerActiveGuard, controller.cancelOwnerReservation);
router.put("/owner/reservations/:id/complete", ownerActiveGuard, controller.completeOwnerReservation);

router.get("/owner/statistics", ownerActiveGuard, controller.ownerStatistics);

module.exports = router;
