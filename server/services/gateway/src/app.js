const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
const LOUNGE_SERVICE_URL = process.env.LOUNGE_SERVICE_URL || "http://lounge-service:3002";
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || "http://reservation-service:3003";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://payment-service:3004";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3005";

// Gateway health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Proxy Socket.IO WebSockets first
app.use("/socket.io", createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  ws: true,
  changeOrigin: true
}));

// Route mappings
// 1. Auth Service
app.use("/owner/login", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/owner/staff", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/admin/login", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/admin/statistics", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));

// 2. Lounge Service
app.use("/organizations", createProxyMiddleware({ target: LOUNGE_SERVICE_URL, changeOrigin: true }));
app.use("/owner/tables", createProxyMiddleware({ target: LOUNGE_SERVICE_URL, changeOrigin: true }));
app.use("/owner/menu-items", createProxyMiddleware({ target: LOUNGE_SERVICE_URL, changeOrigin: true }));
app.use("/admin/organizations", createProxyMiddleware({ target: LOUNGE_SERVICE_URL, changeOrigin: true }));

// 3. Reservation Service
app.use("/reservations", createProxyMiddleware({ target: RESERVATION_SERVICE_URL, changeOrigin: true }));
app.use("/owner/reservations", createProxyMiddleware({ target: RESERVATION_SERVICE_URL, changeOrigin: true }));
app.use("/owner/statistics", createProxyMiddleware({ target: RESERVATION_SERVICE_URL, changeOrigin: true }));

// 4. Payment Service
app.use("/payments", createProxyMiddleware({ target: PAYMENT_SERVICE_URL, changeOrigin: true }));
app.use("/owner/subscription", createProxyMiddleware({ target: PAYMENT_SERVICE_URL, changeOrigin: true }));

// 5. Notification Service (standard HTTP APIs if any)
app.use("/notifications", createProxyMiddleware({ target: NOTIFICATION_SERVICE_URL, changeOrigin: true }));

module.exports = app;
