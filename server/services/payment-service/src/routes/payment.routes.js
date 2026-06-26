const express = require("express");
const {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  handleStripeWebhook,
  createQpayInvoice,
  handleQpayWebhook,
} = require("../modules/payments/payment.service");
const { ownerGuard } = require("../middlewares/auth.middleware");
const prisma = require("../utils/prisma");

const router = express.Router();

// Owner payment checkout sessions. Organization is taken from the owner token.
router.post("/payments/stripe/create-checkout-session", ownerGuard, express.json(), async (req, res, next) => {
  try {
    const data = await createStripeCheckoutSession({
      ...req.body,
      organizationId: req.user.organizationId,
      periodDays: 30,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/payments/stripe/customer-portal", ownerGuard, express.json(), async (req, res, next) => {
  try {
    const data = await createStripeCustomerPortalSession({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/payments/qpay/create-invoice", ownerGuard, express.json(), async (req, res, next) => {
  try {
    const data = await createQpayInvoice({
      ...req.body,
      organizationId: req.user.organizationId,
      periodDays: 30,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// Payment webhooks
router.post("/payments/webhook/stripe", express.raw({ type: "application/json" }), async (req, res, next) => {
  try {
    const data = await handleStripeWebhook(req.body, req.headers["stripe-signature"]);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/payments/webhook/qpay", express.json(), async (req, res, next) => {
  try {
    const data = await handleQpayWebhook(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Owner subscription status API
router.get("/owner/subscription", ownerGuard, async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiry: true,
        name: true,
      },
    });

    const payments = await prisma.payment.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      data: {
        organization,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
