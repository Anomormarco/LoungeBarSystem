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

function findStaffByEmail(email) {
  return prisma.staff.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
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

function createOwnerOrganization({ organization, owner }) {
  return prisma.$transaction(async (tx) => {
    const createdOrganization = await tx.organization.create({
      data: organization,
    });

    const createdOwner = await tx.staff.create({
      data: {
        ...owner,
        organizationId: createdOrganization.id,
        role: "manager",
      },
      include: {
        organization: true,
      },
    });

    return createdOwner;
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
  findStaffByEmail,
  findAdminByEmail,
  createOwnerOrganization,
  getAdminStatistics,
};
