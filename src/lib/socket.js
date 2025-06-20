import { Server } from "socket.io";
import http from "http";

let io;
const userSocketMap = {};

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
}

export function getIO() {
  return io;
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}
