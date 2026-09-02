require("../../utils/loadEnv");
const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const qpayClient = require("../../utils/qpayClient");

// QPay-only: Stripe was fully removed (checkout, portal, webhook, and the
// mock-success fallback that used to activate a subscription for free when
// no Stripe key was configured - see git history for the old code if Stripe
// is ever reinstated).

function periodEnd(days = 30) {
  const end = new Date();
  end.setDate(end.getDate() + Number(days || 30));
  return end;
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
      currency: String(currency || "mnt").toLowerCase(),
      paymentMethod,
      paymentStatus: "pending",
      periodStart: new Date(),
      periodEnd: periodEnd(periodDays),
    },
  });
}

// The auto-renewal trigger: a successful payment (real QPay only - see
// checkQpayPayment) extends the organization's access to the payment's own
// periodEnd (set at creation time from the plan's periodDays), i.e. paying
// adds the days and re-activates access in one step.
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

async function failPayment(paymentId, failureReason = null) {
  const parsedPaymentId = Number(paymentId);

  if (!Number.isInteger(parsedPaymentId)) {
    throw httpError(400, "Төлбөрийн ID буруу байна.");
  }

  return prisma.payment.update({
    where: { id: parsedPaymentId },
    data: {
      paymentStatus: "failed",
      failureReason,
    },
  });
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
  createQpayInvoice,
  checkQpayPayment,
  handleQpayWebhook,
  activatePayment,
};
