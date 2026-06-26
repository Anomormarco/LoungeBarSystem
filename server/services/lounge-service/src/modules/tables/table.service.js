const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

async function getOrganizationTables(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Байгууллагын ID буруу байна.");
  }

  return prisma.table.findMany({
    where: { organizationId },
    orderBy: { tableNumber: "asc" },
  });
}

module.exports = {
  getOrganizationTables,
};
