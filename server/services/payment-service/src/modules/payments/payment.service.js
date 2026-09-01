const Stripe = require("stripe");
require("../../utils/loadEnv");
const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const qpayClient = require("../../utils/qpayClient");

function periodEnd(days = 30) {
  const end = new Date();
  end.setDate(end.getDate() + Number(days || 30));
  return end;
}

function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function mockStripeEnabled() {
  return String(process.env.STRIPE_MOCK_SUCCESS || "").toLowerCase() === "true";
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

async function activateMockStripePayment(payment, payload, reason) {
  const checkoutSessionId = `mock_checkout_${payment.id}`;
  const activatedPayment = await activatePayment(payment.id, {
    stripeCheckoutSessionId: checkoutSessionId,
    stripePaymentIntentId: `mock_pi_${payment.id}`,
    stripeCustomerId: `mock_customer_${payment.organizationId}`,
    currency: payment.currency,
  });

  return {
    payment: activatedPayment,
    checkoutSessionId,
    checkoutUrl: payload.successUrl || process.env.STRIPE_SUCCESS_URL || "/subscription?success=true",
    mode: "mock",
    mock: true,
    message: reason || "Stripe mock payment амжилттай баталгаажлаа.",
  };
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
    return activateMockStripePayment(payment, payload, "STRIPE_SECRET_KEY тохируулагдаагүй тул mock Stripe payment амжилттай болголоо.");
  }

  if (mockStripeEnabled()) {
    return activateMockStripePayment(payment, payload, "STRIPE_MOCK_SUCCESS=true тул mock Stripe payment амжилттай болголоо.");
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

  let session;
  try {
    session = await stripe.checkout.sessions.create(sessionPayload);
  } catch (error) {
    console.error("[stripe-checkout] falling back to mock success:", error.message);
    return activateMockStripePayment(payment, payload, "Stripe session үүсэхэд алдаа гарсан тул mock payment амжилттай болголоо.");
  }
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
    return {
      portalUrl: returnUrl || process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:5173/subscription",
      mode: "mock",
      message: "Stripe mock billing portal.",
    };
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

  if (payment?.stripeCustomerId && (mockStripeEnabled() || payment.stripeCustomerId.startsWith("mock_customer_"))) {
    return {
      portalUrl: returnUrl || process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:5173/subscription",
      mode: "mock",
      message: "Stripe mock billing portal.",
    };
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

function qpayCallbackUrl(paymentId) {
  const base = (process.env.QPAY_CALLBACK_URL || "").trim();
  if (!base) return undefined;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}paymentId=${paymentId}`;
}

async function createQpayInvoice(payload) {
  const payment = await createPendingPayment({
    ...payload,
    currency: "mnt",
    paymentMethod: "qpay",
  });

  if (!qpayClient.qpayConfigured()) {
    return {
      payment,
      mode: "dev",
      invoiceId: `qpay-dev-${payment.id}`,
      qrText: `qpay://invoice/${payment.id}?amount=${payment.amount}&currency=${payment.currency}`,
      message: "QPay merchant API тохируулагдаагүй тул энэ нь туршилтын QR байна. Жинхэнэ QPay ажиллуулахын тулд merchant эрх, API credential шаардлагатай.",
    };
  }

  let invoiceResponse;
  try {
    invoiceResponse = await qpayClient.createInvoice({
      senderInvoiceNo: `sub-${payment.id}`,
      description: `${payload.planType || "Subscription"} ${payment.amount}₮`,
      amount: payment.amount,
      callbackUrl: qpayCallbackUrl(payment.id),
    });
  } catch (error) {
    console.error("[qpay] invoice creation failed:", error.message, error.qpayResponse || "");
    await failPayment(payment.id, `QPay invoice үүсгэхэд алдаа гарлаа: ${error.message}`);
    throw httpError(502, "QPay invoice үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { qpayInvoiceId: invoiceResponse.invoice_id },
  });

  return {
    payment: updatedPayment,
    mode: "live",
    invoiceId: invoiceResponse.invoice_id,
    qrText: invoiceResponse.qr_text,
    qrImage: invoiceResponse.qr_image,
    shortUrl: invoiceResponse.qPay_shortUrl,
    urls: invoiceResponse.urls,
  };
}

// Re-checks a pending QPay payment against QPay's own /v2/payment/check and
// activates the subscription only if QPay itself reports it as paid. Never
// trusts a caller-supplied "it's paid" claim (used by both the webhook ping
// and the client's status-polling).
async function checkQpayPayment(paymentId, { organizationId } = {}) {
  const parsedPaymentId = Number(paymentId);
  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Төлбөрийн ID буруу байна.");
  }

  const payment = await prisma.payment.findUnique({ where: { id: parsedPaymentId } });
  if (!payment || payment.paymentMethod !== "qpay") {
    throw httpError(404, "QPay төлбөр олдсонгүй.");
  }
  if (organizationId != null && payment.organizationId !== Number(organizationId)) {
    throw httpError(403, "Энэ төлбөрийг харах эрхгүй байна.");
  }

  if (payment.paymentStatus === "success") {
    return { payment, status: "success" };
  }

  if (!payment.qpayInvoiceId || !qpayClient.qpayConfigured()) {
    return { payment, status: payment.paymentStatus };
  }

  const result = await qpayClient.checkPayment(payment.qpayInvoiceId);
  const paidRow = (result.rows || []).find(
    (row) => String(row.payment_status || "").toUpperCase() === "PAID"
  );

  if (paidRow) {
    const activated = await activatePayment(payment.id, { paidAt: new Date() });
    return { payment: activated, status: "success" };
  }

  return { payment, status: payment.paymentStatus };
}

async function handleQpayWebhook(query = {}, payload = {}) {
  const paymentId = query.paymentId || payload.paymentId || payload.payment_id;
  if (!paymentId) {
    return { received: true };
  }

  // Once real QPay credentials are configured, the webhook is only a trigger
  // to re-verify - it never activates a payment on its own claimed status.
  if (qpayClient.qpayConfigured()) {
    try {
      await checkQpayPayment(paymentId);
    } catch (error) {
      console.error("[qpay-webhook] verify failed:", error.message);
    }
    return { received: true };
  }

  // No QPay credentials configured (local/dev): fall back to trusting the
  // payload directly so `simulateQpayPayment` keeps working for local testing.
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
  checkQpayPayment,
  handleQpayWebhook,
  activatePayment,
};
