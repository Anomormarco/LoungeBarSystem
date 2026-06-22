const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 3002;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Lounge Service listening on port ${PORT}`);
});
