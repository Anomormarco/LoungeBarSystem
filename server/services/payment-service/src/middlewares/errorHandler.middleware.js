function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isUnexpected = statusCode >= 500;
  if (isUnexpected) {
    console.error(`[payment-service] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(statusCode).json({
    message: isUnexpected ? "Серверийн дотоод алдаа гарлаа." : err.message || "Серверийн дотоод алдаа гарлаа.",
  });
}

module.exports = errorHandler;
