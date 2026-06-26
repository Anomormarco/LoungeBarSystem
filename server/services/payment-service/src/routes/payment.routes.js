const express = require("express");
const controller = require("../controllers/payment.controller");
const { ownerGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/payments/stripe/create-checkout-session",
  ownerGuard,
  express.json(),
  controller.createStripeCheckout
);
router.post(
  "/payments/stripe/customer-portal",
  ownerGuard,
  express.json(),
  controller.createStripePortal
);
router.post(
  "/payments/qpay/create-invoice",
  ownerGuard,
  express.json(),
  controller.createQpayInvoice
);

router.post("/payments/webhook/stripe", express.raw({ type: "application/json" }), controller.stripeWebhook);
router.post("/payments/webhook/qpay", express.json(), controller.qpayWebhook);

router.get("/owner/subscription", ownerGuard, controller.ownerSubscription);

module.exports = router;
