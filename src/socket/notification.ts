import { Server, Socket } from "socket.io";

let io: Server;

export const setupNotificationSocket = (server: any) => {
  io = new Server(server, { cors: { origin: "*" } });
  io.on("connection", (socket: Socket) => {
    console.log(`🔔 Client connected: ${socket.id}`);
    socket.on("subscribeToNotifications", (userId) => {
      socket.join(userId);
      console.log(`📢 User ${userId} joined notifications`);
    });
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

export { io };
