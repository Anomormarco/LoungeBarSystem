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

function updateStaffById(id, data) {
  return prisma.staff.update({
    where: { id },
    data,
    include: {
      organization: true,
    },
  });
}

function findOrganizationByName(name) {
  return prisma.organization.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
    },
  });
}

function createManagerStaff(data) {
  return prisma.staff.create({
    data: {
      ...data,
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
  updateStaffById,
  findOrganizationByName,
  createManagerStaff,
  findAdminByEmail,
  createOwnerOrganization,
  getAdminStatistics,
};
