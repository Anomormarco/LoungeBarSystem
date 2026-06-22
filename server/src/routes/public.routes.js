const express = require("express");
const {
  getNearbyOrganizations,
  getOrganizationDetail,
} = require("../modules/organizations/organization.service");
const { getOrganizationTables } = require("../modules/tables/table.service");
const { getOrganizationMenu } = require("../modules/menu/menu.service");
const {
  sendReservationOtp,
  createReservation,
  verifyReservationOtp,
} = require("../modules/reservations/reservation.service");

const router = express.Router();

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

module.exports = router;
