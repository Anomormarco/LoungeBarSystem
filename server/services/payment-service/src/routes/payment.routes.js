const express = require("express");
const {
  createStripeCheckoutSession,
  handleStripeWebhook,
  createQpayInvoice,
  handleQpayWebhook,
} = require("../modules/payments/payment.service");
const { ownerGuard } = require("../middlewares/auth.middleware");
const prisma = require("../utils/prisma");

const router = express.Router();

// Public payment checkout sessions
router.post("/payments/stripe/create-checkout-session", express.json(), async (req, res, next) => {
  try {
    const data = await createStripeCheckoutSession(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/payments/qpay/create-invoice", express.json(), async (req, res, next) => {
  try {
    const data = await createQpayInvoice(req.body);
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
