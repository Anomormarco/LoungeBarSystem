const express = require("express");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.use("/", paymentRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Серверийн дотоод алдаа гарлаа.",
  });
});

module.exports = app;
