const reservationService = require("../modules/reservations/reservation.service");
const statisticsService = require("../modules/statistics/statistics.service");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function sendOtp(req, res) {
  const data = await reservationService.sendReservationOtp(req.body);
  res.status(201).json({ data });
}

async function verifyOtp(req, res) {
  const data = await reservationService.verifyReservationOtp(req.body);
  res.json({ data });
}

async function createReservation(req, res) {
  const data = await reservationService.createReservation(req.body);
  res.status(201).json({ data });
}

async function ownerReservations(req, res) {
  const data = await reservationService.getOwnerReservations(req.user.organizationId);
  res.json({ data });
}

async function updateOwnerReservation(req, res, status) {
  const data = await reservationService.updateOwnerReservationStatus({
    reservationId: req.params.id,
    organizationId: req.user.organizationId,
    status,
  });
  res.json({ data });
}

async function confirmOwnerReservation(req, res) {
  return updateOwnerReservation(req, res, "confirmed");
}

async function cancelOwnerReservation(req, res) {
  return updateOwnerReservation(req, res, "cancelled");
}

async function completeOwnerReservation(req, res) {
  return updateOwnerReservation(req, res, "completed");
}

async function ownerStatistics(req, res) {
  const data = await statisticsService.getOwnerStatistics(req.user.organizationId, req.query.range);
  res.json({ data });
}

module.exports = {
  sendOtp: asyncHandler(sendOtp),
  verifyOtp: asyncHandler(verifyOtp),
  createReservation: asyncHandler(createReservation),
  ownerReservations: asyncHandler(ownerReservations),
  confirmOwnerReservation: asyncHandler(confirmOwnerReservation),
  cancelOwnerReservation: asyncHandler(cancelOwnerReservation),
  completeOwnerReservation: asyncHandler(completeOwnerReservation),
  ownerStatistics: asyncHandler(ownerStatistics),
};
