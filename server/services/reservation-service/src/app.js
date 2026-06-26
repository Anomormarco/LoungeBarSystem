const express = require("express");
const reservationRoutes = require("./routes/reservation.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "reservation-service" });
});

app.use("/", reservationRoutes);
app.use(errorHandler);

module.exports = app;
