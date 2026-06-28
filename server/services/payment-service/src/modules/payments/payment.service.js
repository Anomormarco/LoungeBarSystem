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

function isActiveStripeStatus(status) {
  return ["active", "trialing"].includes(status);
}

function dateFromStripeSeconds(seconds) {
  return seconds ? new Date(seconds * 1000) : null;
}

async function createPendingPayment({ organizationId, planType, amount, paymentMethod, periodDays, currency }) {
  const parsedOrganizationId = Number(organizationId);
  const parsedAmount = Number(amount);

  if (!Number.isInteger(parsedOrganizationId) || !planType || !Number.isFinite(parsedAmount)) {
    throw httpError(400, "Байгууллагын ID, багцын төрөл болон дүн шаардлагатай.");
  }

  return prisma.payment.create({
    data: {
      organizationId: parsedOrganizationId,
      planType,
      amount: parsedAmount,
      currency: String(currency || process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
      paymentMethod,
      paymentStatus: "pending",
      periodStart: new Date(),
      periodEnd: periodEnd(periodDays),
    },
  });
}

async function activatePayment(paymentId, metadata = {}) {
  const parsedPaymentId = Number(paymentId);

  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Төлбөрийн ID буруу байна.");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: parsedPaymentId },
      data: {
        paymentStatus: "success",
        paidAt: metadata.paidAt || new Date(),
        stripeCheckoutSessionId: metadata.stripeCheckoutSessionId,
        stripePaymentIntentId: metadata.stripePaymentIntentId,
        stripeSubscriptionId: metadata.stripeSubscriptionId,
        stripeCustomerId: metadata.stripeCustomerId,
        stripeInvoiceId: metadata.stripeInvoiceId,
        currency: metadata.currency || undefined,
        failureReason: null,
      },
    });

    await tx.organization.update({
      where: { id: payment.organizationId },
      data: {
        subscriptionStatus: "active",
        subscriptionExpiry: payment.periodEnd,
        isApproved: true,
      },
    });

    return payment;
  });
}

async function failPayment(paymentId, failureReason = null, metadata = {}) {
  const parsedPaymentId = Number(paymentId);

  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Төлбөрийн ID буруу байна.");
  }

  return prisma.payment.update({
    where: { id: parsedPaymentId },
    data: {
      paymentStatus: "failed",
      failureReason,
      stripeCheckoutSessionId: metadata.stripeCheckoutSessionId,
      stripePaymentIntentId: metadata.stripePaymentIntentId,
      stripeCustomerId: metadata.stripeCustomerId,
      stripeInvoiceId: metadata.stripeInvoiceId,
    },
  });
}

async function createStripeCheckoutSession(payload) {
  const currency = String(payload.currency || process.env.STRIPE_CURRENCY || "usd").toLowerCase();
  const payment = await createPendingPayment({
    ...payload,
    currency,
    paymentMethod: "stripe",
  });
  const stripe = stripeClient();

  if (!stripe) {
    return {
      payment,
      checkoutUrl: null,
      mode: "dev",
      message: "STRIPE_SECRET_KEY тохируулагдаагүй байна.",
    };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: Number(payload.organizationId) },
    select: {
      name: true,
      staff: {
        where: { role: "manager" },
        select: { email: true, name: true },
        take: 1,
      },
    },
  });
  const owner = organization?.staff?.[0];
  const priceId = process.env.STRIPE_PRICE_ID;
  const checkoutMode = priceId ? "subscription" : "payment";

  const sessionPayload = {
    mode: checkoutMode,
    success_url: payload.successUrl || process.env.STRIPE_SUCCESS_URL || "http://localhost:5173/payment/success",
    cancel_url: payload.cancelUrl || process.env.STRIPE_CANCEL_URL || "http://localhost:5173/payment/cancel",
    customer_email: owner?.email,
    client_reference_id: String(payment.organizationId),
    metadata: {
      paymentId: String(payment.id),
      organizationId: String(payment.organizationId),
      planType: String(payload.planType),
      periodDays: String(payload.periodDays || 30),
    },
    line_items: [
      priceId
        ? { quantity: 1, price: priceId }
        : {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: Math.round(Number(payload.amount) * 100),
              product_data: {
                name: `${organization?.name || "LoungeBar"} ${payload.planType} subscription`,
              },
            },
          },
    ],
  };

  if (checkoutMode === "payment") {
    sessionPayload.payment_intent_data = {
      metadata: {
        paymentId: String(payment.id),
        organizationId: String(payment.organizationId),
      },
    };
  } else {
    sessionPayload.subscription_data = {
      metadata: {
        paymentId: String(payment.id),
        organizationId: String(payment.organizationId),
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionPayload);
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      currency,
    },
  });

  return {
    payment: updatedPayment,
    checkoutSessionId: session.id,
    checkoutUrl: session.url,
    mode: checkoutMode,
  };
}

async function createStripeCustomerPortalSession({ organizationId, returnUrl }) {
  const stripe = stripeClient();
  if (!stripe) {
    throw httpError(400, "STRIPE_SECRET_KEY тохируулагдаагүй байна.");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      organizationId: Number(organizationId),
      paymentMethod: "stripe",
      stripeCustomerId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment?.stripeCustomerId) {
    throw httpError(404, "Stripe хэрэглэгч олдсонгүй. Эхлээд Stripe төлбөр хийнэ үү.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: payment.stripeCustomerId,
    return_url: returnUrl || process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:5173/subscription",
  });

  return { portalUrl: session.url };
}

async function activateStripeSubscriptionPayment(session, subscription) {
  const paymentId = session.metadata?.paymentId || subscription.metadata?.paymentId;
  if (!paymentId) return null;

  const status = subscription.status;
  const periodEndDate = dateFromStripeSeconds(subscription.current_period_end);
  const periodStartDate = dateFromStripeSeconds(subscription.current_period_start);

  if (!isActiveStripeStatus(status)) {
    return failPayment(paymentId, `Stripe subscription төлөв: ${status}`, {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId: subscription.id,
    });
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: Number(paymentId) },
      data: {
        paymentStatus: "success",
        paidAt: new Date(),
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId: subscription.id,
        stripeInvoiceId: typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : null,
        periodStart: periodStartDate || undefined,
        periodEnd: periodEndDate || undefined,
        failureReason: null,
      },
    });

    await tx.organization.update({
      where: { id: payment.organizationId },
      data: {
        subscriptionStatus: "active",
        subscriptionExpiry: periodEndDate || payment.periodEnd,
        isApproved: true,
      },
    });

    return payment;
  });
}

async function handleStripeWebhook(rawBody, signature) {
  const stripe = stripeClient();

  if (!stripe) {
    throw httpError(400, "STRIPE_SECRET_KEY тохируулагдаагүй байна.");
  }

  const event = process.env.STRIPE_WEBHOOK_SECRET
    ? stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
    : JSON.parse(rawBody.toString("utf8"));

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const paymentId = intent.metadata?.paymentId;
    if (paymentId) {
      await activatePayment(paymentId, {
        paidAt: dateFromStripeSeconds(intent.created),
        stripePaymentIntentId: intent.id,
        stripeCustomerId: typeof intent.customer === "string" ? intent.customer : null,
        currency: intent.currency,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const paymentId = intent.metadata?.paymentId;
    if (paymentId) {
      await failPayment(paymentId, intent.last_payment_error?.message || "Stripe төлбөр амжилтгүй боллоо.", {
        stripePaymentIntentId: intent.id,
        stripeCustomerId: typeof intent.customer === "string" ? intent.customer : null,
      });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;

    if (session.mode === "subscription" && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await activateStripeSubscriptionPayment(session, subscription);
    } else if (paymentId && session.payment_status === "paid") {
      await activatePayment(paymentId, {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        currency: session.currency,
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await failPayment(paymentId, "Stripe төлбөрийн холбоосын хугацаа дууссан байна.", {
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const active = isActiveStripeStatus(subscription.status);
    const periodEndDate = dateFromStripeSeconds(subscription.current_period_end);

    await prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: { stripeSubscriptionId: subscription.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      });
      const payment = payments[0];
      if (!payment) return;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: active ? "success" : "failed",
          periodEnd: periodEndDate || payment.periodEnd,
          failureReason: active ? null : `Stripe subscription төлөв: ${subscription.status}`,
        },
      });

      await tx.organization.update({
        where: { id: payment.organizationId },
        data: {
          subscriptionStatus: active ? "active" : "expired",
          subscriptionExpiry: periodEndDate || payment.periodEnd,
          isApproved: active,
        },
      });
    });
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
    mode: "dev",
    invoiceId: `qpay-dev-${payment.id}`,
    qrText: `qpay://invoice/${payment.id}?amount=${payment.amount}&currency=${payment.currency}`,
    message: "QPay merchant API тохируулагдаагүй тул энэ нь туршилтын QR байна. Жинхэнэ QPay ажиллуулахын тулд merchant эрх, API credential шаардлагатай.",
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
    const payment = await failPayment(paymentId, "QPay төлбөр амжилтгүй эсвэл цуцлагдсан байна.");
    return { payment };
  }

  return { received: true };
}

module.exports = {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  handleStripeWebhook,
  createQpayInvoice,
  handleQpayWebhook,
  activatePayment,
};
