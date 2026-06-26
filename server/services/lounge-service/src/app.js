const express = require("express");
const loungeRoutes = require("./routes/lounge.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "lounge-service" });
});

app.use("/", loungeRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Серверийн дотоод алдаа гарлаа.",
  });
});

module.exports = app;
