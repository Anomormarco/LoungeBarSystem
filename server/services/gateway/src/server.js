const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.setMaxListeners(50);

server.listen(PORT, () => {
  console.log(`API Gateway ${PORT} \u043f\u043e\u0440\u0442 \u0434\u044d\u044d\u0440 \u0430\u0441\u043b\u0430\u0430.`);
});
