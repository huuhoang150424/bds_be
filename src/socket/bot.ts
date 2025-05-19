import { Socket } from 'socket.io';
import { ChatService } from '@service';

export const botSocket = (io: any) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Chat client connected: ${socket.id}`);

    socket.on('chatMessage', async (data: { content: string }) => {
      try {
        const { content } = data;
        if (!content) {
          socket.emit('chatResponse', { 
            message: 'Nội dung tin nhắn không được để trống', 
            posts: [], 
            advice: '' 
          });
          return;
        }

        const { type, conditions, advice: parseAdvice } = await ChatService.parseUserRequest(content);

        if (type === 'none') {
          socket.emit('chatResponse', { 
            message: parseAdvice, 
            posts: [], 
            advice: parseAdvice 
          });
          return;
        }

        let posts = [];
        let finalAdvice = parseAdvice;
        let responseMessage = '';

        const result = await ChatService.getPostsByConditions(conditions, type, content);
        posts = result.posts;
        finalAdvice = `${parseAdvice} ${result.advice}`.trim();

        if (type === 'search') {
          responseMessage = posts.length > 0 
            ? 'Danh sách bài đăng phù hợp:'
            : 'Không tìm thấy bài đăng nào phù hợp.';
        } else if (type === 'consulting') {
          responseMessage = 'Tư vấn mua nhà:';
        }

        socket.emit('chatResponse', {
          posts: Array.isArray(posts) ? posts.map((post: any) => post.toJSON()) : [],
          message: responseMessage,
          advice: finalAdvice,
        });
      } catch (error) {
        console.error('Error in chat:', error);
        socket.emit('chatResponse', { 
          message: 'Có lỗi xảy ra', 
          posts: [], 
          advice: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.' 
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Chat client disconnected: ${socket.id}`);
    });
  });
};