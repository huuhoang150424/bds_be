import {  Socket } from "socket.io";



export const setupNotificationSocket = (io: any) => {
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
