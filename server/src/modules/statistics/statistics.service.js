const prisma = require("../../utils/prisma");

function rangeStart(range) {
  const days = range === "30d" ? 30 : 7;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start;
}

async function getOwnerStatistics(organizationId, range = "7d") {
  const start = rangeStart(range);

  const [totalReservations, byStatus, completedPayments, reservations] = await Promise.all([
    prisma.reservation.count({
      where: {
        organizationId,
        createdAt: { gte: start },
      },
    }),
    prisma.reservation.groupBy({
      by: ["status"],
      where: {
        organizationId,
        createdAt: { gte: start },
      },
      _count: { status: true },
    }),
    prisma.payment.aggregate({
      where: {
        organizationId,
        paymentStatus: "success",
        createdAt: { gte: start },
      },
      _sum: { amount: true },
    }),
    prisma.reservation.findMany({
      where: {
        organizationId,
        createdAt: { gte: start },
      },
      select: {
        tableId: true,
        startTime: true,
      },
    }),
  ]);

  const tableCounts = new Map();
  const hourCounts = new Map();

  for (const reservation of reservations) {
    tableCounts.set(reservation.tableId, (tableCounts.get(reservation.tableId) || 0) + 1);
    const hour = reservation.startTime.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  const topTable = [...tableCounts.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  const topHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  return {
    range,
    totalReservations,
    reservationsByStatus: byStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    })),
    revenue: completedPayments._sum.amount || 0,
    topTable: topTable ? { tableId: topTable[0], count: topTable[1] } : null,
    topHour: topHour ? { hour: topHour[0], count: topHour[1] } : null,
  };
}

module.exports = {
  getOwnerStatistics,
};
