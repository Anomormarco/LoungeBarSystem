function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 502;
  res.status(statusCode).json({
    message: err.message || "Сервис рүү холбогдоход алдаа гарлаа.",
  });
}

module.exports = errorHandler;
