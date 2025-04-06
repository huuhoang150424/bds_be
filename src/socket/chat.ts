import { Server, Socket } from 'socket.io';

export const chatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Kết nối chat mới:', socket.id);

    // join conversation room
    socket.on('joinChatConversation', (userId: string) => {
      socket.join(userId);
      console.log(`Người dùng ${userId} đã tham gia phòng chat`);

			//...
    });

    socket.on('disconnect', () => {
      console.log('Ngắt kết nối chat:', socket.id);
    });
  });
};
