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
    throw httpError(400, "Email shaardlagatai");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw httpError(400, "Email buruu baina");
  }

  if (reservationId && !Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Zahialgiin id buruu baina");
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
    subject: "Lounge Reserve verification code",
    text: `Your Lounge Reserve verification code is ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin: 0 0 12px;">Lounge Reserve</h2>
        <p>Your reservation verification code is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 18px 0;">${code}</div>
        <p>This code expires in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you did not request this code, you can ignore this email.</p>
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
    endTime,
    guestCount,
  } = payload;

  const parsedOrganizationId = Number(organizationId);
  const parsedTableId = Number(tableId);
  const parsedGuestCount = Number(guestCount);
  const parsedReservationDate = reservationDateOnly(reservationDate);
  const parsedStartTime = parseDateTime(reservationDate, startTime);
  const parsedEndTime = parseDateTime(reservationDate, endTime);

  if (
    !Number.isInteger(parsedOrganizationId) ||
    !Number.isInteger(parsedTableId) ||
    !Number.isInteger(parsedGuestCount) ||
    !guestName ||
    !guestPhone ||
    !guestEmail ||
    !parsedReservationDate ||
    !parsedStartTime ||
    !parsedEndTime
  ) {
    throw httpError(400, "Zahialgiin medeelel buruu baina");
  }

  if (parsedStartTime >= parsedEndTime) {
    throw httpError(400, "Duusah tsag ehleh tsagaas hoish baih yostoi");
  }

  return {
    organizationId: parsedOrganizationId,
    tableId: parsedTableId,
    guestName,
    guestPhone,
    guestEmail,
    reservationDate: parsedReservationDate,
    startTime: parsedStartTime,
    endTime: parsedEndTime,
    guestCount: parsedGuestCount,
  };
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
      throw httpError(400, "Shiree zahialah bolomjgui baina");
    }

    if (data.guestCount > table.capacity) {
      throw httpError(400, "Zochnii too shireenii suudlaas ih baina");
    }

    const overlappingReservation = await tx.reservation.findFirst({
      where: {
        tableId: data.tableId,
        reservationDate: data.reservationDate,
        status: { in: ["pending", "confirmed"] },
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (overlappingReservation) {
      throw httpError(409, "Ene tsagt shiree zahialgatai baina");
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

    await tx.table.update({
      where: { id: data.tableId },
      data: { status: "reserved" },
    });

    await createReservationNotification(tx, {
      organizationId: data.organizationId,
      guestName: data.guestName,
      tableNumber: table.table_number,
    });

    return createdReservation;
  });

  emitToOrganization(data.organizationId, "reservation:new", reservation);
  emitToOrganization(data.organizationId, "table:status_changed", {
    tableId: data.tableId,
    status: "reserved",
    reservationId: reservation.id,
  });

  return reservation;
}

async function verifyReservationOtp({ email, code, reservationId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const parsedReservationId = Number(reservationId);

  if (!normalizedEmail || !code || !Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Email, code bolon zahialgiin id shaardlagatai");
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
      throw httpError(400, "OTP code buruu esvel hugatsaa duussan baina");
    }

    const existingReservation = await tx.reservation.findUnique({
      where: { id: parsedReservationId },
    });

    if (!existingReservation || existingReservation.status !== "pending") {
      throw httpError(400, "Zahialgiig batalgaajuulah bolomjgui");
    }

    const lockedTables = await tx.$queryRaw`
      SELECT *
      FROM tables
      WHERE id = ${existingReservation.tableId}
        AND organization_id = ${existingReservation.organizationId}
      FOR UPDATE
    `;

    if (!lockedTables[0]) {
      throw httpError(400, "Shiree zahialah bolomjgui baina");
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
      throw httpError(409, "Ene tsagt shiree batalgaajsan zahialgatai baina");
    }

    await tx.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    return tx.reservation.update({
      where: { id: existingReservation.id },
      data: { status: "confirmed" },
      include: { table: true },
    });
  });

  emitToOrganization(reservation.organizationId, "reservation:confirmed", reservation);

  return reservation;
}

async function updateOwnerReservationStatus({ reservationId, organizationId, status }) {
  const parsedReservationId = Number(reservationId);

  if (!Number.isInteger(parsedReservationId)) {
    throw httpError(400, "Zahialgiin id buruu baina");
  }

  const allowedStatuses = ["confirmed", "cancelled", "completed"];

  if (!allowedStatuses.includes(status)) {
    throw httpError(400, "Zahialgiin tuluv buruu baina");
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const existingReservation = await tx.reservation.findFirst({
      where: {
        id: parsedReservationId,
        organizationId,
      },
    });

    if (!existingReservation) {
      throw httpError(404, "Zahialga oldsongui");
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
        throw httpError(409, "Ene tsagt shiree batalgaajsan zahialgatai baina");
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
