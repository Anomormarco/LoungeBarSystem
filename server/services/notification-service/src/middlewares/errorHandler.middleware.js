function errorHandler(err, req, res, next) {
  console.error("[notification-service-error]", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Серверийн дотоод алдаа гарлаа.",
  });
}

module.exports = errorHandler;
