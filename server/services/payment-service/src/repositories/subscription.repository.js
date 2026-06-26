const prisma = require("../utils/prisma");

async function findOwnerSubscription(organizationId) {
  const [organization, payments] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiry: true,
        name: true,
      },
    }),
    prisma.payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { organization, payments };
}

module.exports = {
  findOwnerSubscription,
};
