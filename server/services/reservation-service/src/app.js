const express = require("express");
const reservationRoutes = require("./routes/reservation.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "reservation-service" });
});

app.use("/", reservationRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Serveriin dotood aldaa garlaa",
  });
});

module.exports = app;
