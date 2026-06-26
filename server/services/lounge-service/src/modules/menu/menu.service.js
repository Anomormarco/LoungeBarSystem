const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");

async function getOrganizationMenu(id) {
  const organizationId = Number(id);

  if (!Number.isInteger(organizationId)) {
    throw httpError(400, "Байгууллагын ID буруу байна.");
  }

  return prisma.menuItem.findMany({
    where: {
      organizationId,
      isAvailable: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

module.exports = {
  getOrganizationMenu,
};


