const prisma = require("../utils/prisma");
const { emitToOrganization } = require("../socket");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function expireClosedDayReservations() {
  const today = localDateString();
  const reservationDate = new Date(`${today}T00:00:00`);
  const organizations = await prisma.organization.findMany({
    select: { id: true },
  });

  let expiredCount = 0;

  for (const organization of organizations) {
    const reservations = await prisma.reservation.findMany({
      where: {
        organizationId: organization.id,
        reservationDate,
        status: { in: ["pending", "confirmed"] },
        endTime: { lte: new Date() },
      },
      select: { id: true, tableId: true },
    });

    if (reservations.length === 0) continue;

    const tableIds = [...new Set(reservations.map((reservation) => reservation.tableId))];
    const reservationIds = reservations.map((reservation) => reservation.id);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: { id: { in: reservationIds } },
        data: { status: "expired" },
      });

      await tx.table.updateMany({
        where: {
          id: { in: tableIds },
          organizationId: organization.id,
        },
        data: { status: "available" },
      });
    });

    expiredCount += reservationIds.length;
    for (const tableId of tableIds) {
      emitToOrganization(organization.id, "table:status_changed", {
        tableId,
        status: "available",
      });
    }
    emitToOrganization(organization.id, "reservation:expired", { reservationIds });
  }

  return { expiredCount };
}

function startReservationExpireJob() {
  const intervalMs = Number(process.env.RESERVATION_EXPIRE_JOB_INTERVAL_MS || 60_000);
  expireClosedDayReservations().catch((error) => console.error("[reservation-expire-job]", error));

  return setInterval(() => {
    expireClosedDayReservations().catch((error) => console.error("[reservation-expire-job]", error));
  }, intervalMs);
}

module.exports = {
  expireClosedDayReservations,
  startReservationExpireJob,
};
