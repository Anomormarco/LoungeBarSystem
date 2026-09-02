const express = require("express");
const controller = require("../controllers/payment.controller");
const { ownerGuard } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/payments/qpay/create-invoice",
  ownerGuard,
  express.json(),
  controller.createQpayInvoice
);

router.post("/payments/webhook/qpay", express.json(), controller.qpayWebhook);
router.get("/payments/webhook/qpay", controller.qpayWebhook);
router.get("/payments/qpay/status/:id", ownerGuard, controller.checkQpayStatus);

router.get("/owner/subscription", ownerGuard, controller.ownerSubscription);

module.exports = router;
