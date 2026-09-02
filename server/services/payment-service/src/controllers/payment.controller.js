const paymentService = require("../modules/payments/payment.service");
const subscriptionRepository = require("../repositories/subscription.repository");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function subscriptionPeriodDays(value) {
  const days = Number(value || 30);
  if (days === 365) return 365;
  return 30;
}

async function createQpayInvoice(req, res) {
  const data = await paymentService.createQpayInvoice({
    ...req.body,
    organizationId: req.user.organizationId,
    periodDays: subscriptionPeriodDays(req.body.periodDays),
  });
  res.status(201).json({ data });
}

async function qpayWebhook(req, res) {
  const data = await paymentService.handleQpayWebhook(req.query, req.body || {});
  res.json(data);
}

async function checkQpayStatus(req, res) {
  const data = await paymentService.checkQpayPayment(req.params.id, {
    organizationId: req.user.organizationId,
  });
  res.json({ data });
}

async function ownerSubscription(req, res) {
  const data = await subscriptionRepository.findOwnerSubscription(req.user.organizationId);
  res.json({ data });
}

module.exports = {
  createQpayInvoice: asyncHandler(createQpayInvoice),
  qpayWebhook: asyncHandler(qpayWebhook),
  checkQpayStatus: asyncHandler(checkQpayStatus),
  ownerSubscription: asyncHandler(ownerSubscription),
};
