const { Server } = require("socket.io");

let io;


function organizationRoom(organizationId) {
  return `organization:${organizationId}`;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("organization:join", (organizationId) => {
      if (!organizationId) return;
      socket.join(organizationRoom(organizationId));
    });

    socket.on("organization:leave", (organizationId) => {
      if (!organizationId) return;
      socket.leave(organizationRoom(organizationId));
    });
  });

  return io;
}

function emitToOrganization(organizationId, eventName, payload) {
  if (!io) return;
  io.to(organizationRoom(organizationId)).emit(eventName, payload);
}

module.exports = {
  initSocket,
  emitToOrganization,
};
