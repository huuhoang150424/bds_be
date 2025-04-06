import User from '@models/user.model';
import { Server, Socket } from 'socket.io';

export const chatSocket = (io: Server) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('joinChatConversation', async (userId) => {
      console.log(`User ${userId} connected`);
      (socket as any).userId = userId;
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      await User.update({ lastActive: new Date() }, { where: { id: userId } });
      const users = await User.findAll({ attributes: ['id', 'lastActive'] });
      const userStatusList = users.map((user) => ({
        userId: user.id,
        active: onlineUsers.has(user.id),
        lastActive: user.lastActive ? user.lastActive.toISOString() : null,
      }));
      socket.emit('allUserStatus', userStatusList);
      io.emit('userStatusUpdate', {
        userId,
        active: true,
        lastActive: new Date().toISOString(),
      });
    });

    socket.on('getUserStatus', async (targetUserId) => {
      const targetUser = await User.findByPk(targetUserId, { attributes: ['id', 'lastActive'] });
      if (targetUser) {
        const isActive = onlineUsers.has(targetUser.id);
        socket.emit('userStatus', {
          userId: targetUser.id,
          active: isActive,
          lastActive: targetUser.lastActive ? targetUser.lastActive.toISOString() : null,
        });
      }
    });
    
    socket.on('disconnect', async () => {
      if ((socket as any).userId) {
        console.log(`User ${(socket as any).userId} disconnected`);
        await User.update({ lastActive: new Date() }, { where: { id: (socket as any).userId } });
        onlineUsers.delete((socket as any).userId);
        io.emit('userStatusUpdate', {
          userId: (socket as any).userId,
          active: false,
          lastActive: new Date().toISOString(),
        });
      }
    });
  });
};