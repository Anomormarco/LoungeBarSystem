const express = require("express");
const loungeRoutes = require("./routes/lounge.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "lounge-service" });
});

app.use("/", loungeRoutes);
app.use(errorHandler);

module.exports = app;
