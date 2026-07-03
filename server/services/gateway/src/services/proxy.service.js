const { createProxyMiddleware } = require("http-proxy-middleware");

function handleProxyError(target) {
  return (err, req, res) => {
    console.error(`[gateway] proxy error ${req.method} ${req.originalUrl} -> ${target}:`, err.message);

    if (res.headersSent) {
      return;
    }

    res.status(502).json({
      message: "Gateway service connection failed.",
      target,
    });
  };
}

function serviceProxy(target, options = {}) {
  const { on, ...proxyOptions } = options;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 60000,
    proxyTimeout: 60000,
    pathRewrite: (_path, req) => req.originalUrl,
    ...proxyOptions,
    on: {
      error: handleProxyError(target),
      ...on,
    },
  });
}

function socketProxy(target) {
  return createProxyMiddleware({
    target,
    ws: true,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      error: handleProxyError(target),
    },
  });
}

module.exports = {
  serviceProxy,
  socketProxy,
};
