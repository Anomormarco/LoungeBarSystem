const http = require("http");
const app = require("./app");
const { startReservationExpireJob } = require("./jobs/reservationExpire.job");

const PORT = process.env.PORT || 3003;
const server = http.createServer(app);

startReservationExpireJob();

server.listen(PORT, () => {
  console.log(`Захиалгын сервис ${PORT} порт дээр аслаа.`);
});
