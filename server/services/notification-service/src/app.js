const express = require("express");
const notificationRoutes = require("./routes/notification.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(express.json());
app.use("/", notificationRoutes);
app.use(errorHandler);

module.exports = app;
