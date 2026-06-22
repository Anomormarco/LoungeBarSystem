const cron = require("node-cron");
const prisma = require("../utils/prisma");

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
  return cron.schedule("*/30 * * * *", async () => {
    try {
      await expireSubscriptions();
    } catch (error) {
      console.error("[subscription-expire-job]", error);
    }
  });
}

module.exports = {
  expireSubscriptions,
  startSubscriptionExpireJob,
};
