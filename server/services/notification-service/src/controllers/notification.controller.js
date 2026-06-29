const notificationService = require("../services/notification.service");

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function health(_req, res) {
  res.json({ status: "ok", service: "notification-service" });
}

async function emitInternal(req, res) {
  const data = notificationService.emitInternalEvent(req.body);
  res.json(data);
}

module.exports = {
  health: asyncHandler(health),
  emitInternal: asyncHandler(emitInternal),
};
