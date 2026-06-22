const express = require("express");
const { ownerLogin } = require("../modules/auth/auth.service");
const { updateOwnerReservationStatus } = require("../modules/reservations/reservation.service");
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
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
} = require("../modules/staff/staff.service");
const { getOwnerStatistics } = require("../modules/statistics/statistics.service");
const { ownerGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const data = await ownerLogin(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get("/tables", ownerGuard, async (req, res, next) => {
  try {
    const tables = await getOwnerTables(req.user.organizationId);
    res.json({ data: tables });
  } catch (error) {
    next(error);
  }
});

router.post("/tables", ownerGuard, async (req, res, next) => {
  try {
    const table = await createOwnerTable(req.user.organizationId, req.body);
    res.status(201).json({ data: table });
  } catch (error) {
    next(error);
  }
});

router.put("/tables/:id", ownerGuard, async (req, res, next) => {
  try {
    const table = await updateOwnerTable(req.user.organizationId, req.params.id, req.body);
    res.json({ data: table });
  } catch (error) {
    next(error);
  }
});

router.delete("/tables/:id", ownerGuard, async (req, res, next) => {
  try {
    const table = await deleteOwnerTable(req.user.organizationId, req.params.id);
    res.json({ data: table });
  } catch (error) {
    next(error);
  }
});

router.get("/menu-items", ownerGuard, async (req, res, next) => {
  try {
    const menuItems = await getOwnerMenuItems(req.user.organizationId);
    res.json({ data: menuItems });
  } catch (error) {
    next(error);
  }
});

router.post("/menu-items", ownerGuard, async (req, res, next) => {
  try {
    const menuItem = await createOwnerMenuItem(req.user.organizationId, req.body);
    res.status(201).json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.put("/menu-items/:id", ownerGuard, async (req, res, next) => {
  try {
    const menuItem = await updateOwnerMenuItem(req.user.organizationId, req.params.id, req.body);
    res.json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.delete("/menu-items/:id", ownerGuard, async (req, res, next) => {
  try {
    const menuItem = await deleteOwnerMenuItem(req.user.organizationId, req.params.id);
    res.json({ data: menuItem });
  } catch (error) {
    next(error);
  }
});

router.get("/staff", ownerGuard, async (req, res, next) => {
  try {
    const staff = await getOwnerStaff(req.user.organizationId);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.post("/staff", ownerGuard, async (req, res, next) => {
  try {
    const staff = await createOwnerStaff(req.user.organizationId, req.body);
    res.status(201).json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.put("/staff/:id", ownerGuard, async (req, res, next) => {
  try {
    const staff = await updateOwnerStaff(req.user.organizationId, req.params.id, req.body);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.delete("/staff/:id", ownerGuard, async (req, res, next) => {
  try {
    const staff = await deleteOwnerStaff(req.user.organizationId, req.params.id);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.get("/statistics", ownerGuard, async (req, res, next) => {
  try {
    const statistics = await getOwnerStatistics(req.user.organizationId, req.query.range);
    res.json({ data: statistics });
  } catch (error) {
    next(error);
  }
});

router.put("/reservations/:id/confirm", ownerGuard, async (req, res, next) => {
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

router.put("/reservations/:id/cancel", ownerGuard, async (req, res, next) => {
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

router.put("/reservations/:id/complete", ownerGuard, async (req, res, next) => {
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

module.exports = router;
