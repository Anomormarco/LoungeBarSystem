const http = require("http");
const app = require("./app");
const { startSubscriptionExpireJob } = require("./jobs/subscriptionExpire.job");

const PORT = process.env.PORT || 3004;
const server = http.createServer(app);

startSubscriptionExpireJob();

server.listen(PORT, () => {
  console.log(`Төлбөрийн сервис ${PORT} порт дээр аслаа.`);
});
