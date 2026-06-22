const express = require("express");
const { ownerLogin, adminLogin } = require("../modules/auth/auth.service");
const {
  getOwnerStaff,
  createOwnerStaff,
  updateOwnerStaff,
  deleteOwnerStaff,
} = require("../modules/staff/staff.service");
const { ownerGuard, adminGuard } = require("../middlewares/auth.middleware");
const prisma = require("../utils/prisma");

const router = express.Router();

// Owner login
router.post("/owner/login", async (req, res, next) => {
  try {
    const data = await ownerLogin(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// Owner staff management
router.get("/owner/staff", ownerGuard, async (req, res, next) => {
  try {
    const staff = await getOwnerStaff(req.user.organizationId);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.post("/owner/staff", ownerGuard, async (req, res, next) => {
  try {
    const staff = await createOwnerStaff(req.user.organizationId, req.body);
    res.status(201).json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.put("/owner/staff/:id", ownerGuard, async (req, res, next) => {
  try {
    const staff = await updateOwnerStaff(req.user.organizationId, req.params.id, req.body);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

router.delete("/owner/staff/:id", ownerGuard, async (req, res, next) => {
  try {
    const staff = await deleteOwnerStaff(req.user.organizationId, req.params.id);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

// Admin login
router.post("/admin/login", async (req, res, next) => {
  try {
    const data = await adminLogin(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// Admin statistics
router.get("/admin/statistics", adminGuard, async (req, res, next) => {
  try {
    const [totalOrganizations, activeSubscriptions, totalReservations, cancelledReservations] =
      await Promise.all([
        prisma.organization.count(),
        prisma.organization.count({ where: { subscriptionStatus: "active" } }),
        prisma.reservation.count(),
        prisma.reservation.count({ where: { status: "cancelled" } }),
      ]);

    res.json({
      data: {
        totalOrganizations,
        activeSubscriptions,
        totalReservations,
        cancelledReservations,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
