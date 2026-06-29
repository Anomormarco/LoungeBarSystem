const { clientOrigin } = require("../config/serviceUrls");

function isAllowedDevOrigin(origin) {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return url.protocol === "http:" && url.port === "5173";
  } catch (_error) {
    return false;
  }
}

function corsMiddleware(req, res, next) {
  const allowedOrigins = new Set([
    clientOrigin,
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
}

module.exports = corsMiddleware;
