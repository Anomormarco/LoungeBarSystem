const Stripe = require("stripe");
const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

function periodEnd(days = 30) {
  const end = new Date();
  end.setDate(end.getDate() + Number(days || 30));
  return end;
}

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function createPendingPayment({ organizationId, planType, amount, paymentMethod, periodDays }) {
  const parsedOrganizationId = Number(organizationId);
  const parsedAmount = Number(amount);

  if (!Number.isInteger(parsedOrganizationId) || !planType || !Number.isFinite(parsedAmount)) {
    throw httpError(400, "Baiguullagiin id, plan turul bolon dun shaardlagatai");
  }

  return prisma.payment.create({
    data: {
      organizationId: parsedOrganizationId,
      planType,
      amount: parsedAmount,
      paymentMethod,
      paymentStatus: "pending",
      periodStart: new Date(),
      periodEnd: periodEnd(periodDays),
    },
  });
}

async function activatePayment(paymentId) {
  const parsedPaymentId = Number(paymentId);

  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Tulburiin id buruu baina");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: parsedPaymentId },
      data: { paymentStatus: "success" },
    });

    await tx.organization.update({
      where: { id: payment.organizationId },
      data: {
        subscriptionStatus: "active",
        subscriptionExpiry: payment.periodEnd,
      },
    });

    return payment;
  });
}

async function failPayment(paymentId) {
  const parsedPaymentId = Number(paymentId);

  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Tulburiin id buruu baina");
  }

  return prisma.payment.update({
    where: { id: parsedPaymentId },
    data: { paymentStatus: "failed" },
  });
}

async function createStripeCheckoutSession(payload) {
  const payment = await createPendingPayment({
    ...payload,
    paymentMethod: "stripe",
  });
  const stripe = stripeClient();

  if (!stripe) {
    return {
      payment,
      checkoutUrl: null,
      mode: "dev",
      message: "STRIPE_SECRET_KEY tohiruulagdaagui baina",
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: payload.successUrl || process.env.STRIPE_SUCCESS_URL || "http://localhost:5173/payment/success",
    cancel_url: payload.cancelUrl || process.env.STRIPE_CANCEL_URL || "http://localhost:5173/payment/cancel",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: payload.currency || "usd",
          unit_amount: Math.round(Number(payload.amount) * 100),
          product_data: {
            name: `${payload.planType} subscription`,
          },
        },
      },
    ],
    metadata: {
      paymentId: String(payment.id),
      organizationId: String(payment.organizationId),
    },
    payment_intent_data: {
      metadata: {
        paymentId: String(payment.id),
        organizationId: String(payment.organizationId),
      },
    },
  });

  return {
    payment,
    checkoutSessionId: session.id,
    checkoutUrl: session.url,
  };
}

async function handleStripeWebhook(rawBody, signature) {
  const stripe = stripeClient();

  if (!stripe) {
    throw httpError(400, "STRIPE_SECRET_KEY tohiruulagdaagui baina");
  }

  const event = process.env.STRIPE_WEBHOOK_SECRET
    ? stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
    : JSON.parse(rawBody.toString("utf8"));

  if (event.type === "payment_intent.succeeded") {
    const paymentId = event.data.object.metadata?.paymentId;
    if (paymentId) await activatePayment(paymentId);
  }

  return { received: true };
}

async function createQpayInvoice(payload) {
  const payment = await createPendingPayment({
    ...payload,
    paymentMethod: "qpay",
  });

  return {
    payment,
    invoiceId: `qpay-dev-${payment.id}`,
    qrText: `qpay://invoice/${payment.id}`,
    callbackPayload: {
      paymentId: payment.id,
      status: "success",
    },
  };
}

async function handleQpayWebhook(payload) {
  const paymentId = payload.paymentId || payload.payment_id;
  const status = payload.status || payload.payment_status;

  if (status === "success" || status === "paid") {
    const payment = await activatePayment(paymentId);
    return { payment };
  }

  if (status === "failed" || status === "cancelled") {
    const payment = await failPayment(paymentId);
    return { payment };
  }

  return { received: true };
}

module.exports = {
  createStripeCheckoutSession,
  handleStripeWebhook,
  createQpayInvoice,
  handleQpayWebhook,
  activatePayment,
};
