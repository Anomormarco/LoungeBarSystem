const express = require("express");
const gatewayRoutes = require("./routes/gateway.routes");
const corsMiddleware = require("./middlewares/cors.middleware");
const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(corsMiddleware);
app.use(rateLimiter);
app.use("/", gatewayRoutes);
app.use(errorHandler);

module.exports = app;
