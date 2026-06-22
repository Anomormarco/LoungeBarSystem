const express = require("express");
const {
  sendReservationOtp,
  createReservation,
  verifyReservationOtp,
  updateOwnerReservationStatus,
  getOwnerReservations,
} = require("../modules/reservations/reservation.service");
const { getOwnerStatistics } = require("../modules/statistics/statistics.service");
const { ownerGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public reservation APIs
router.post("/reservations/send-otp", async (req, res, next) => {
  try {
    const otp = await sendReservationOtp(req.body);
    res.status(201).json({ data: otp });
  } catch (error) {
    next(error);
  }
});

router.post("/reservations/verify-otp", async (req, res, next) => {
  try {
    const reservation = await verifyReservationOtp(req.body);
    res.json({ data: reservation });
  } catch (error) {
    next(error);
  }
});

router.post("/reservations", async (req, res, next) => {
  try {
    const reservation = await createReservation(req.body);
    res.status(201).json({ data: reservation });
  } catch (error) {
    next(error);
  }
});

// Owner reservation dashboard APIs
router.get("/owner/reservations", ownerGuard, async (req, res, next) => {
  try {
    const reservations = await getOwnerReservations(req.user.organizationId);
    res.json({ data: reservations });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/reservations/:id/confirm", ownerGuard, async (req, res, next) => {
  try {
    const reservation = await updateOwnerReservationStatus({
      reservationId: req.params.id,
      organizationId: req.user.organizationId,
      status: "confirmed",
    });
    res.json({ data: reservation });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/reservations/:id/cancel", ownerGuard, async (req, res, next) => {
  try {
    const reservation = await updateOwnerReservationStatus({
      reservationId: req.params.id,
      organizationId: req.user.organizationId,
      status: "cancelled",
    });
    res.json({ data: reservation });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/reservations/:id/complete", ownerGuard, async (req, res, next) => {
  try {
    const reservation = await updateOwnerReservationStatus({
      reservationId: req.params.id,
      organizationId: req.user.organizationId,
      status: "completed",
    });
    res.json({ data: reservation });
  } catch (error) {
    next(error);
  }
});

// Owner stats APIs
router.get("/owner/statistics", ownerGuard, async (req, res, next) => {
  try {
    const statistics = await getOwnerStatistics(req.user.organizationId, req.query.range);
    res.json({ data: statistics });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
