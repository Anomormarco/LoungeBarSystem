const express = require("express");
const {
  createStripeCheckoutSession,
  handleStripeWebhook,
  createQpayInvoice,
  handleQpayWebhook,
} = require("../modules/payments/payment.service");

const router = express.Router();

router.post("/stripe/create-checkout-session", express.json(), async (req, res, next) => {
  try {
    const data = await createStripeCheckoutSession(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/qpay/create-invoice", express.json(), async (req, res, next) => {
  try {
    const data = await createQpayInvoice(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res, next) => {
  try {
    const data = await handleStripeWebhook(req.body, req.headers["stripe-signature"]);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/webhook/qpay", express.json(), async (req, res, next) => {
  try {
    const data = await handleQpayWebhook(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
