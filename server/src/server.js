const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket");
const { startSubscriptionExpireJob } = require("./jobs/subscriptionExpire.job");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

initSocket(server);
startSubscriptionExpireJob();

server.listen(PORT, () => {
  console.log(`server ${PORT} deer aslaa`);
});
