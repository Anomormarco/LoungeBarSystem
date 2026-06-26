const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket");

const PORT = process.env.PORT || 3005;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Мэдэгдлийн сервис ${PORT} порт дээр аслаа.`);
});
