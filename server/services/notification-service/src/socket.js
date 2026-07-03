const { Server } = require("socket.io");

let io;

function organizationRoom(organizationId) {
  return `organization:${organizationId}`;
}

function allowedOrigins() {
  const configured = String(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    ...configured,
    "https://lounge-bar-system.vercel.app",
    "http://localhost:5173",
  ]);
}

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins().has(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Socket origin not allowed: ${origin}`));
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Клиент холбогдлоо: ${socket.id}`);

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
      console.log(`Клиент саллаа: ${socket.id}`);
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
