const express = require("express");
const { emitToOrganization } = require("./socket");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/internal/emit", (req, res) => {
  const { organizationId, eventName, payload } = req.body;
  if (!organizationId || !eventName) {
    return res.status(400).json({ error: "organizationId болон eventName шаардлагатай." });
  }
  emitToOrganization(organizationId, eventName, payload);
  res.json({ success: true });
});

app.use((err, req, res, next) => {
  console.error("[notification-service-error]", err);
  res.status(500).json({ error: err.message || "Сервер дээр алдаа гарлаа." });
});

module.exports = app;
