const express = require("express");
const { emitToOrganization } = require("./socket");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/internal/emit", (req, res, next) => {
  const { organizationId, eventName, payload } = req.body;
  if (!organizationId || !eventName) {
    const error = new Error("organizationId болон eventName шаардлагатай.");
    error.statusCode = 400;
    return next(error);
  }
  emitToOrganization(organizationId, eventName, payload);
  res.json({ success: true });
});

app.use(errorHandler);

module.exports = app;
