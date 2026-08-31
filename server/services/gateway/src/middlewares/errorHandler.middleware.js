function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 502;
  const isUnexpected = statusCode >= 500;
  if (isUnexpected) {
    console.error(`[gateway] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(statusCode).json({
    message: isUnexpected ? "Сервис рүү холбогдоход алдаа гарлаа." : err.message || "Сервис рүү холбогдоход алдаа гарлаа.",
  });
}

module.exports = errorHandler;
