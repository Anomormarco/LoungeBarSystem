const prisma = require("../utils/prisma");

function findManagerByEmail(email) {
  return prisma.staff.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      role: "manager",
    },
    include: {
      organization: true,
    },
  });
}

function findAdminByEmail(email) {
  return prisma.admin.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
  });
}

function getAdminStatistics() {
  return Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { subscriptionStatus: "active" } }),
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "cancelled" } }),
  ]);
}

module.exports = {
  findManagerByEmail,
  findAdminByEmail,
  getAdminStatistics,
};
