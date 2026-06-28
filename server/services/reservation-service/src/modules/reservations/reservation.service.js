const prisma = require("../../utils/prisma");
const httpError = require("../../utils/httpError");
const generateOtp = require("../../utils/genrateOtp");
const sendEmail = require("../../utils/sendEmail");
const { emitToOrganization } = require("../../socket");
const { createReservationNotification } = require("../notification/notification.service");

function parseDateTime(date, timeOrDateTime) {
  if (!date || !timeOrDateTime) return null;

  const value = String(timeOrDateTime);
  const dateTime = value.includes("T") ? new Date(value) : new Date(`${date}T${value}:00`);

  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || "").split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return hours * 60 + minutes;
}

function dateTimeFromMinutes(date, minutes) {
  const dayOffset = Math.floor(minutes / 1440);
  const minuteOfDay = minutes % 1440;
  const hours = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + dayOffset);
  result.setHours(hours, mins, 0, 0);
  return result;
}

function reservationDateOnly(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function expiresInMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function sendReservationOtp({ email, reservationId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const parsedReservationId = reservationId ? Number(reservationId) : null;

  if (!normalizedEmail) {
    throw httpError(400, "Имэйл шаардлагатай.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw httpError(400, "Имэйл хаяг буруу байна.");
  }

  if (reservationId && !Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Захиалгын ID буруу байна.");
  }

  const code = generateOtp();
  const expiresAt = expiresInMinutes(5);

  const verificationCode = await prisma.verificationCode.create({
    data: {
      email: normalizedEmail,
      code,
      reservationId: parsedReservationId,
      expiresAt,
    },
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Lounge Reserve баталгаажуулах код",
    text: `Таны Lounge Reserve баталгаажуулах код: ${code}. Код 5 минутын дараа хүчингүй болно.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin: 0 0 12px;">Lounge Reserve</h2>
        <p>Таны захиалга баталгаажуулах код:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 18px 0;">${code}</div>
        <p>Энэ код 5 минутын дараа хүчингүй болно.</p>
        <p style="color: #6b7280; font-size: 12px;">Хэрэв та энэ кодыг хүсээгүй бол энэ имэйлийг үл тоож болно.</p>
      </div>
    `,
  });

  return {
    id: verificationCode.id,
    email: verificationCode.email,
    expiresAt: verificationCode.expiresAt,
  };
}

function parseReservationPayload(payload) {
  const {
    organizationId,
    tableId,
    guestName,
    guestPhone,
    guestEmail,
    reservationDate,
    startTime,
    guestCount,
  } = payload;

  const parsedOrganizationId = Number(organizationId);
  const parsedTableId = Number(tableId);
  const parsedGuestCount = Number(guestCount);
  const parsedReservationDate = reservationDateOnly(reservationDate);
  const parsedStartTime = parseDateTime(reservationDate, startTime);

  if (
    !Number.isInteger(parsedOrganizationId) ||
    !Number.isInteger(parsedTableId) ||
    !Number.isInteger(parsedGuestCount) ||
    !guestName ||
    !guestPhone ||
    !guestEmail ||
    !parsedReservationDate ||
    !parsedStartTime
  ) {
    throw httpError(400, "Захиалгын мэдээлэл буруу байна.");
  }

  return {
    organizationId: parsedOrganizationId,
    tableId: parsedTableId,
    guestName,
    guestPhone,
    guestEmail,
    reservationDateRaw: reservationDate,
    startTimeRaw: startTime,
    reservationDate: parsedReservationDate,
    startTime: parsedStartTime,
    guestCount: parsedGuestCount,
  };
}

function calculateReservationEndTime({ reservationDate, startTime, openingTime, closingTime }) {
  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutesRaw = timeToMinutes(closingTime);
  const startMinutes = timeToMinutes(startTime);
  const durationMinutes = Number(process.env.RESERVATION_DURATION_MINUTES || 120);

  if (openingMinutes === null || closingMinutesRaw === null || startMinutes === null) {
    throw httpError(400, "Ажлын цаг эсвэл захиалгын эхлэх цаг буруу байна.");
  }

  const closingMinutes = closingMinutesRaw <= openingMinutes ? closingMinutesRaw + 1440 : closingMinutesRaw;
  const normalizedStartMinutes = startMinutes < openingMinutes && closingMinutesRaw <= openingMinutes
    ? startMinutes + 1440
    : startMinutes;

  if (normalizedStartMinutes < openingMinutes || normalizedStartMinutes >= closingMinutes) {
    throw httpError(400, "Сонгосон цаг lounge-ийн ажиллах цагт багтахгүй байна.");
  }

  const startDateTime = dateTimeFromMinutes(reservationDate, normalizedStartMinutes);
  const closingDateTime = dateTimeFromMinutes(reservationDate, closingMinutes);
  const endDateTime = addMinutes(startDateTime, durationMinutes);

  return endDateTime > closingDateTime ? closingDateTime : endDateTime;
}

async function createReservation(payload) {
  const data = parseReservationPayload(payload);

  const reservation = await prisma.$transaction(async (tx) => {
    const lockedTables = await tx.$queryRaw`
      SELECT *
      FROM tables
      WHERE id = ${data.tableId}
        AND organization_id = ${data.organizationId}
      FOR UPDATE
    `;
    const table = lockedTables[0];

    if (!table || ["disabled", "occupied"].includes(table.status)) {
      throw httpError(400, "Энэ ширээг захиалах боломжгүй байна.");
    }

    if (data.guestCount > table.capacity) {
      throw httpError(400, "Зочдын тоо ширээний суудлаас их байна.");
    }

    const organization = await tx.organization.findUnique({
      where: { id: data.organizationId },
      select: { openingTime: true, closingTime: true },
    });

    if (!organization) {
      throw httpError(404, "Байгууллага олдсонгүй.");
    }

    data.endTime = calculateReservationEndTime({
      reservationDate: data.reservationDateRaw,
      startTime: data.startTimeRaw,
      openingTime: organization.openingTime,
      closingTime: organization.closingTime,
    });

    if (data.startTime >= data.endTime) {
      throw httpError(400, "Захиалгын эхлэх цаг ажлын цагт багтахгүй байна.");
    }

    const overlappingReservation = await tx.reservation.findFirst({
      where: {
        tableId: data.tableId,
        reservationDate: data.reservationDate,
        status: "confirmed",
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (overlappingReservation) {
      throw httpError(409, "Энэ цагт ширээ аль хэдийн захиалгатай байна.");
    }

    const createdReservation = await tx.reservation.create({
      data: {
        organizationId: data.organizationId,
        tableId: data.tableId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        reservationDate: data.reservationDate,
        startTime: data.startTime,
        endTime: data.endTime,
        guestCount: data.guestCount,
        status: "pending",
      },
      include: {
        table: true,
      },
    });

    return createdReservation;
  });

  return reservation;
}

async function verifyReservationOtp({ email, code, reservationId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const parsedReservationId = Number(reservationId);

  if (!normalizedEmail || !code || !Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Имэйл, код болон захиалгын ID шаардлагатай.");
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const verificationCode = await tx.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        reservationId: parsedReservationId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationCode) {
      throw httpError(400, "Баталгаажуулах код буруу эсвэл хугацаа дууссан байна.");
    }

    const existingReservation = await tx.reservation.findUnique({
      where: { id: parsedReservationId },
    });

    if (!existingReservation || existingReservation.status !== "pending") {
      throw httpError(400, "Энэ захиалгыг баталгаажуулах боломжгүй байна.");
    }

    const lockedTables = await tx.$queryRaw`
      SELECT *
      FROM tables
      WHERE id = ${existingReservation.tableId}
        AND organization_id = ${existingReservation.organizationId}
      FOR UPDATE
    `;

    if (!lockedTables[0]) {
      throw httpError(400, "Энэ ширээг захиалах боломжгүй байна.");
    }

    const overlappingReservation = await tx.reservation.findFirst({
      where: {
        id: { not: existingReservation.id },
        tableId: existingReservation.tableId,
        reservationDate: existingReservation.reservationDate,
        status: "confirmed",
        startTime: { lt: existingReservation.endTime },
        endTime: { gt: existingReservation.startTime },
      },
    });

    if (overlappingReservation) {
      throw httpError(409, "Энэ цагт баталгаажсан захиалга байна.");
    }

    await tx.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    await tx.table.update({
      where: { id: existingReservation.tableId },
      data: { status: "reserved" },
    });

    await createReservationNotification(tx, {
      organizationId: existingReservation.organizationId,
      guestName: existingReservation.guestName,
      tableNumber: lockedTables[0].table_number,
    });

    return tx.reservation.update({
      where: { id: existingReservation.id },
      data: { status: "confirmed" },
      include: { table: true },
    });
  });

  emitToOrganization(reservation.organizationId, "reservation:new", reservation);
  emitToOrganization(reservation.organizationId, "table:status_changed", {
    tableId: reservation.tableId,
    status: "reserved",
    reservationId: reservation.id,
  });

  return reservation;
}

async function updateOwnerReservationStatus({ reservationId, organizationId, status }) {
  const parsedReservationId = Number(reservationId);

  if (!Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Захиалгын ID буруу байна.");
  }

  const allowedStatuses = ["confirmed", "cancelled", "completed"];

  if (!allowedStatuses.includes(status)) {
    throw httpError(400, "Захиалгын төлөв буруу байна.");
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const existingReservation = await tx.reservation.findFirst({
      where: {
        id: parsedReservationId,
        organizationId,
      },
    });

    if (!existingReservation) {
      throw httpError(404, "Захиалга олдсонгүй.");
    }

    if (status === "confirmed") {
      const overlappingReservation = await tx.reservation.findFirst({
        where: {
          id: { not: existingReservation.id },
          tableId: existingReservation.tableId,
          reservationDate: existingReservation.reservationDate,
          status: "confirmed",
          startTime: { lt: existingReservation.endTime },
          endTime: { gt: existingReservation.startTime },
        },
      });

      if (overlappingReservation) {
        throw httpError(409, "Энэ цагт баталгаажсан захиалга байна.");
      }
    }

    const updatedReservation = await tx.reservation.update({
      where: { id: parsedReservationId },
      data: { status },
      include: { table: true },
    });

    if (status === "cancelled" || status === "completed") {
      await tx.table.update({
        where: { id: existingReservation.tableId },
        data: { status: "available" },
      });
    } else if (status === "confirmed") {
      await tx.table.update({
        where: { id: existingReservation.tableId },
        data: { status: "reserved" },
      });
    }

    return updatedReservation;
  });

  emitToOrganization(organizationId, `reservation:${status}`, reservation);
  emitToOrganization(organizationId, "table:status_changed", {
    tableId: reservation.tableId,
    status: status === "cancelled" || status === "completed" ? "available" : "reserved",
    reservationId: reservation.id,
  });

  return reservation;
}

async function getOwnerReservations(organizationId) {
  return prisma.reservation.findMany({
    where: { organizationId },
    include: { table: true },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  sendReservationOtp,
  createReservation,
  verifyReservationOtp,
  updateOwnerReservationStatus,
  getOwnerReservations,
};
