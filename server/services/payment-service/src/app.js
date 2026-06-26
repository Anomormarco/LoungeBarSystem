const express = require("express");
const paymentRoutes = require("./routes/payment.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.use("/", paymentRoutes);
app.use(errorHandler);

module.exports = app;
