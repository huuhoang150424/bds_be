import User from '@models/user.model';
import { Server, Socket } from 'socket.io';

export const chatSocket = (io: Server) => {
	io.on('connection', (socket) => {
    socket.on('joinChatConversation', async (userId) => {
      console.log(`User ${userId} connected`);
      (socket as any).userId = userId;
      socket.join(userId);
      await User.update({ lastActive: new Date() }, { where: { id: userId } });
      const users = await User.findAll({ attributes: ['id', 'lastActive'] });
      const userStatusList = users.map((user) => ({
        userId: user.id,
        active: user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime()) < 5 * 60 * 1000, // Online nếu lastActive < 5 phút
        lastActive: user.lastActive ? user.lastActive.toISOString() : null,
      }));
      socket.emit('allUserStatus', userStatusList); 
      io.emit('userStatusUpdate', {
        userId,
        active: true,
        lastActive: new Date().toISOString(),
      });
    });
    socket.on('disconnect', async () => {
      if ((socket as any).userId) {
        console.log(`User ${(socket as any).userId} disconnected`);
        await User.update({ lastActive: new Date() }, { where: { id: (socket as any).userId } });
        io.emit('userStatusUpdate', {
          userId: (socket as any).userId,
          active: false,
          lastActive: new Date().toISOString(),
        });
      }
    });
  });
};
