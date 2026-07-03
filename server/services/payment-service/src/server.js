const http = require("http");
const app = require("./app");
const { startSubscriptionExpireJob } = require("./jobs/subscriptionExpire.job");

const PORT = process.env.PORT || 3004;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Payment service is running on port ${PORT}.`);

  setTimeout(() => {
    try {
      startSubscriptionExpireJob();
    } catch (error) {
      console.error("[payment-service] subscription jobs failed to start:", error);
    }
  }, 0);
});
