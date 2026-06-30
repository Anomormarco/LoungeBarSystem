const cron = require("node-cron");
const Stripe = require("stripe");
require("../utils/loadEnv");
const prisma = require("../utils/prisma");

function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function isActiveStripeStatus(status) {
  return ["active", "trialing"].includes(status);
}

async function expireSubscriptions() {
  const now = new Date();

  const result = await prisma.organization.updateMany({
    where: {
      subscriptionStatus: "active",
      subscriptionExpiry: {
        lt: now,
      },
    },
    data: {
      subscriptionStatus: "expired",
      isApproved: false,
    },
  });

  return result;
}

async function syncStripeSubscriptions() {
  const stripe = stripeClient();
  if (!stripe) return { checked: 0, skipped: true };

  const payments = await prisma.payment.findMany({
    where: {
      paymentMethod: "stripe",
      stripeSubscriptionId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    distinct: ["stripeSubscriptionId"],
  });

  let checked = 0;
  for (const payment of payments) {
    const subscription = await stripe.subscriptions.retrieve(payment.stripeSubscriptionId);
    const active = isActiveStripeStatus(subscription.status);
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : payment.periodEnd;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: active ? "success" : "failed",
          periodEnd,
          failureReason: active ? null : `Stripe subscription status: ${subscription.status}`,
        },
      });

      await tx.organization.update({
        where: { id: payment.organizationId },
        data: {
          subscriptionStatus: active ? "active" : "expired",
          subscriptionExpiry: periodEnd,
          isApproved: active,
        },
      });
    });
    checked += 1;
  }

  return { checked };
}

function startSubscriptionExpireJob() {
  const expireTask = cron.schedule("*/30 * * * *", async () => {
    try {
      await expireSubscriptions();
    } catch (error) {
      console.error("[subscription-expire-job]", error);
    }
  });

  const stripeSyncTask = cron.schedule("0 0 * * *", async () => {
    try {
      await syncStripeSubscriptions();
    } catch (error) {
      console.error("[stripe-subscription-sync-job]", error);
    }
  });

  return { expireTask, stripeSyncTask };
}

module.exports = {
  expireSubscriptions,
  syncStripeSubscriptions,
  startSubscriptionExpireJob,
};
