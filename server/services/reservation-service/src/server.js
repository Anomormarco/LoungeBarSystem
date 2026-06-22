const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 3003;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Reservation Service listening on port ${PORT}`);
});
