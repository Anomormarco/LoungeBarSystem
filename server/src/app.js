const express = require("express");
const publicRoutes = require("./routes/public.routes");
const ownerRoutes = require("./routes/owner.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use("/payments", paymentRoutes);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", publicRoutes);
app.use("/owner", ownerRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Serveriin dotood aldaa garlaa",
  });
});

module.exports = app;

