const prisma = require("../utils/prisma");
const { emitToOrganization } = require("../socket");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return hours * 60 + minutes;
}

function isClosedForToday(organization, now = new Date()) {
  const openingMinutes = timeToMinutes(organization.openingTime);
  const closingMinutesRaw = timeToMinutes(organization.closingTime);
  if (openingMinutes === null || closingMinutesRaw === null) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = closingMinutesRaw <= openingMinutes ? closingMinutesRaw + 1440 : closingMinutesRaw;
  const normalizedNowMinutes = nowMinutes < openingMinutes && closingMinutesRaw <= openingMinutes
    ? nowMinutes + 1440
    : nowMinutes;

  return normalizedNowMinutes >= closingMinutes;
}

async function expireClosedDayReservations() {
  const today = localDateString();
  const reservationDate = new Date(`${today}T00:00:00`);
  const organizations = await prisma.organization.findMany({
    select: { id: true, openingTime: true, closingTime: true },
  });

  let expiredCount = 0;

  for (const organization of organizations) {
    if (!isClosedForToday(organization)) continue;

    const reservations = await prisma.reservation.findMany({
      where: {
        organizationId: organization.id,
        reservationDate,
        status: { in: ["pending", "confirmed"] },
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
