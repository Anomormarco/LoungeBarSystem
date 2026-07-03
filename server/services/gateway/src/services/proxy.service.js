const { createProxyMiddleware } = require("http-proxy-middleware");

const RETRY_STATUS_CODES = new Set([502, 503, 504]);
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(chunks.length ? Buffer.concat(chunks) : null));
    req.on("error", reject);
  });
}

function handleProxyError(target, err, req, res) {
  console.error(`[gateway] proxy error ${req.method} ${req.originalUrl} -> ${target}:`, err.message);

  if (res.headersSent) {
    return;
  }

  res.status(502).json({
    message: "Gateway service connection failed. Please try again.",
    target,
  });
}

function proxyMiddlewareErrorHandler(target) {
  return (err, req, res) => handleProxyError(target, err, req, res);
}

function targetUrl(target, req) {
  return new URL(req.originalUrl, target).toString();
}

function requestHeaders(req) {
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  return headers;
}

function serviceProxy(target, options = {}) {
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 1500;

  return async (req, res) => {
    let body = null;

    try {
      body = req.method === "GET" || req.method === "HEAD" ? null : await readRequestBody(req);

      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const response = await fetch(targetUrl(target, req), {
          method: req.method,
          headers: requestHeaders(req),
          body,
          redirect: "manual",
        });

        if (RETRY_STATUS_CODES.has(response.status) && attempt < retries) {
          await response.arrayBuffer();
          await sleep(retryDelayMs);
          continue;
        }

        res.status(response.status);
        response.headers.forEach((value, key) => {
          if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });

        const responseBody = Buffer.from(await response.arrayBuffer());
        return res.send(responseBody);
      }
    } catch (err) {
      handleProxyError(target, err, req, res);
    }
  };
}

function socketProxy(target) {
  return createProxyMiddleware({
    target,
    ws: true,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      error: proxyMiddlewareErrorHandler(target),
    },
  });
}

module.exports = {
  serviceProxy,
  socketProxy,
};
