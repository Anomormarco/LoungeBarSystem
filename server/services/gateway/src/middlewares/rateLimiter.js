// A single real page load fans out several parallel API calls (nearby
// organizations, org detail + tables + menu on marker preview, etc.), and a
// person routinely has more than one browser tab open against the same
// public IP (doubly so behind mobile-carrier/office NAT, where many
// unrelated people share one IP). A 1-second window with a 100-request
// ceiling and a 30-minute block turned normal bursts into false-positive
// lockouts. This window/ceiling/block combo is deliberately generous -
// it exists to stop scripted abuse, not ordinary multi-tab browsing.
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300);
const BLOCK_MS = Number(process.env.RATE_LIMIT_BLOCK_MS || 2 * 60 * 1000);
const EXEMPT_PATHS = new Set(["/health"]);

const visitors = new Map();

function getClientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimiter(req, res, next) {
  if (EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  const now = Date.now();
  const key = getClientKey(req);
  const record = visitors.get(key) || {
    count: 0,
    windowStart: now,
    blockedUntil: 0,
  };

  if (record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: `Хэт олон хүсэлт илгээсэн байна. ${retryAfterSeconds} секундийн дараа дахин оролдоно уу.`,
    });
  }

  if (now - record.windowStart > WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    record.blockedUntil = now + BLOCK_MS;
    visitors.set(key, record);
    res.setHeader("Retry-After", String(Math.ceil(BLOCK_MS / 1000)));
    return res.status(429).json({
      message: `Хэт олон хүсэлт илгээсэн тул таны хандалтыг ${Math.ceil(BLOCK_MS / 60000)} минут түр хаалаа.`,
    });
  }

  visitors.set(key, record);
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of visitors.entries()) {
    if (record.blockedUntil <= now && now - record.windowStart > BLOCK_MS) {
      visitors.delete(key);
    }
  }
}, Math.max(BLOCK_MS, 60 * 1000)).unref();

module.exports = rateLimiter;
