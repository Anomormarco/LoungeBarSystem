const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
const LOUNGE_SERVICE_URL = process.env.LOUNGE_SERVICE_URL || "http://lounge-service:3002";
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || "http://reservation-service:3003";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://payment-service:3004";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3005";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

function isAllowedDevOrigin(origin) {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return url.protocol === "http:" && url.port === "5173";
  } catch (_error) {
    return false;
  }
}

function serviceProxy(target, options = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    onError: (err, req, res) => {
      res.status(502).json({ message: "Дотоод сервис рүү холбогдоход алдаа гарлаа." });
    },
    ...options,
  });
}

app.use((req, res, next) => {
  const allowedOrigins = new Set([
    CLIENT_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  const origin = req.headers.origin;

  if (origin && (allowedOrigins.has(origin) || isAllowedDevOrigin(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,stripe-signature");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(rateLimiter);

// Gateway health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Proxy Socket.IO WebSockets first
app.use("/socket.io", createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  ws: true,
  changeOrigin: true,
  pathRewrite: (_path, req) => req.originalUrl,
}));

// Route mappings
// 1. Auth Service
app.use("/owner/login", serviceProxy(AUTH_SERVICE_URL));
app.use("/owner/password", serviceProxy(AUTH_SERVICE_URL));
app.use("/owner/staff", serviceProxy(AUTH_SERVICE_URL));
app.use("/admin/login", serviceProxy(AUTH_SERVICE_URL));
app.use("/admin/statistics", serviceProxy(AUTH_SERVICE_URL));

// 2. Lounge Service
app.use("/organizations", serviceProxy(LOUNGE_SERVICE_URL));
app.use("/owner/tables", serviceProxy(LOUNGE_SERVICE_URL));
app.use("/owner/menu-items", serviceProxy(LOUNGE_SERVICE_URL));
app.use("/admin/organizations", serviceProxy(LOUNGE_SERVICE_URL));

// 3. Reservation Service
app.use("/reservations", serviceProxy(RESERVATION_SERVICE_URL));
app.use("/owner/reservations", serviceProxy(RESERVATION_SERVICE_URL));
app.use("/owner/statistics", serviceProxy(RESERVATION_SERVICE_URL));

// 4. Payment Service
app.use("/payments", serviceProxy(PAYMENT_SERVICE_URL));
app.use("/owner/subscription", serviceProxy(PAYMENT_SERVICE_URL));

// 5. Notification Service (standard HTTP APIs if any)
app.use("/notifications", serviceProxy(NOTIFICATION_SERVICE_URL));

app.use(errorHandler);

module.exports = app;
