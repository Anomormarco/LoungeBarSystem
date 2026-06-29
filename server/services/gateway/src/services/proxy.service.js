const { createProxyMiddleware } = require("http-proxy-middleware");

function serviceProxy(target, options = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    onError: (_err, _req, res) => {
      res.status(502).json({ message: "Дотоод сервис рүү холбогдоход алдаа гарлаа." });
    },
    ...options,
  });
}

function socketProxy(target) {
  return createProxyMiddleware({
    target,
    ws: true,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
  });
}

module.exports = {
  serviceProxy,
  socketProxy,
};
