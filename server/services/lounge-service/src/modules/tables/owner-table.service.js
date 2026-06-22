const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const { emitToOrganization } = require("../../socket");

function parseId(id, label) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) throw httpError(400, `${label} buruu baina`);
  return parsed;
}

async function getOwnerTables(organizationId) {
  return prisma.table.findMany({
    where: { organizationId },
    orderBy: { tableNumber: "asc" },
  });
}

async function createOwnerTable(organizationId, payload) {
  const capacity = Number(payload.capacity);

  if (!payload.tableNumber || !Number.isInteger(capacity)) {
    throw httpError(400, "Shireenii dugaar bolon suudal shaardlagatai");
  }

  const table = await prisma.table.create({
    data: {
      organizationId,
      tableNumber: payload.tableNumber,
      capacity,
      type: payload.type || "normal",
      status: payload.status || "available",
      customStatusLabel: payload.customStatusLabel,
    },
  });

  emitToOrganization(organizationId, "table:created", table);
  return table;
}

async function updateOwnerTable(organizationId, tableId, payload) {
  const id = parseId(tableId, "Shireenii id");
  const data = {};

  for (const field of ["tableNumber", "type", "status", "customStatusLabel"]) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  if (payload.capacity !== undefined) data.capacity = Number(payload.capacity);

  const table = await prisma.table.update({
    where: {
      id,
      organizationId,
    },
    data,
  });

  emitToOrganization(organizationId, "table:status_changed", {
    tableId: table.id,
    status: table.status,
  });

  return table;
}

async function deleteOwnerTable(organizationId, tableId) {
  const id = parseId(tableId, "Shireenii id");

  await prisma.table.delete({
    where: {
      id,
      organizationId,
    },
  });

  emitToOrganization(organizationId, "table:deleted", { tableId: id });
  return { id };
}

module.exports = {
  getOwnerTables,
  createOwnerTable,
  updateOwnerTable,
  deleteOwnerTable,
};
