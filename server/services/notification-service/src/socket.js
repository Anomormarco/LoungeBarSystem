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
    console.log(`Client connected: ${socket.id}`);

    socket.on("organization:join", (organizationId) => {
      if (!organizationId) return;
      console.log(`Socket ${socket.id} joining room for organization:${organizationId}`);
      socket.join(organizationRoom(organizationId));
    });

    socket.on("organization:leave", (organizationId) => {
      if (!organizationId) return;
      console.log(`Socket ${socket.id} leaving room for organization:${organizationId}`);
      socket.leave(organizationRoom(organizationId));
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function emitToOrganization(organizationId, eventName, payload) {
  if (!io) {
    console.warn("Socket.IO not initialized yet.");
    return;
  }
  console.log(`Emitting event ${eventName} to organization:${organizationId}`);
  io.to(organizationRoom(organizationId)).emit(eventName, payload);
}

module.exports = {
  initSocket,
  emitToOrganization,
};
