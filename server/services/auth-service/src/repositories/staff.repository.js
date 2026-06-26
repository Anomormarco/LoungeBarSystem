const prisma = require("../utils/prisma");

function findByOrganization(organizationId) {
  return prisma.staff.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

function findOneByUser(user) {
  return prisma.staff.findFirst({
    where: {
      id: user.id,
      organizationId: user.organizationId,
    },
  });
}

function create(data) {
  return prisma.staff.create({ data });
}

function updateByOrganization({ id, organizationId, data }) {
  return prisma.staff.update({
    where: {
      id,
      organizationId,
    },
    data,
  });
}

function updateById(id, data) {
  return prisma.staff.update({
    where: { id },
    data,
  });
}

async function deleteByOrganization({ id, organizationId }) {
  await prisma.staff.delete({
    where: {
      id,
      organizationId,
    },
  });
  return { id };
}

module.exports = {
  findByOrganization,
  findOneByUser,
  create,
  updateByOrganization,
  updateById,
  deleteByOrganization,
};
