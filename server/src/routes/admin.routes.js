const express = require("express");
const { adminGuard } = require("../middlewares/auth.middleware");
const {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  approveOrganization,
  disableOrganization,
} = require("../modules/admin/admin-organization.service");

const router = express.Router();

router.get("/organizations", adminGuard, async (req, res, next) => {
  try {
    const organizations = await getOrganizations();
    res.json({ data: organizations });
  } catch (error) {
    next(error);
  }
});

router.post("/organizations", adminGuard, async (req, res, next) => {
  try {
    const organization = await createOrganization(req.body);
    res.status(201).json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/organizations/:id", adminGuard, async (req, res, next) => {
  try {
    const organization = await updateOrganization(req.params.id, req.body);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.delete("/organizations/:id", adminGuard, async (req, res, next) => {
  try {
    const organization = await deleteOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/organizations/:id/approve", adminGuard, async (req, res, next) => {
  try {
    const organization = await approveOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

router.put("/organizations/:id/disable", adminGuard, async (req, res, next) => {
  try {
    const organization = await disableOrganization(req.params.id);
    res.json({ data: organization });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
