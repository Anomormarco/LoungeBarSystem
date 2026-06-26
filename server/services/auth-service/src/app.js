const express = require("express");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.use("/", authRoutes);
app.use(errorHandler);

module.exports = app;
