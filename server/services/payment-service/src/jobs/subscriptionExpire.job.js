const cron = require("node-cron");
require("../utils/loadEnv");
const prisma = require("../utils/prisma");

// The auto-renewal/auto-lock trigger: paying (activatePayment, in
// payment.service.js) sets subscriptionExpiry from the plan's periodDays.
// This job is the other half - runs every 30 minutes and flips any
// organization whose subscriptionExpiry has passed to expired/unapproved,
// which is what subscriptionRequired (in each service's auth.middleware.js)
// checks to block the owner's dashboard with a "access temporarily closed"
// message until they pay again.
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

function startSubscriptionExpireJob() {
  const expireTask = cron.schedule("*/30 * * * *", async () => {
    try {
      await expireSubscriptions();
    } catch (error) {
      console.error("[subscription-expire-job]", error);
    }
  });

  return { expireTask };
}

module.exports = {
  expireSubscriptions,
  startSubscriptionExpireJob,
};
