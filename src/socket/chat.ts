import { Socket } from 'socket.io';
import { ChatService } from '@service';

export const chatSocket = (io: any) => {
  io.on('connection', (socket: Socket) => {
    console.log(`💬 Chat client connected: ${socket.id}`);

    socket.on('chatMessage', async (data: { content: string }) => {
      try {
        const { content } = data;
        console.log("gửi lên: ", content);
        if (!content) {
          socket.emit('chatResponse', { message: 'Nội dung tin nhắn không được để trống', posts: [] });
          return;
        }
        const conditions = await ChatService.parseUserRequest(content);
        console.log('Parsed conditions:', conditions);
        const isEmptyConditions = Object.keys(conditions).length === 0 || 
          Object.values(conditions).every(value => value === null || value === undefined);
        if (isEmptyConditions) {
          socket.emit('chatResponse', { 
            message: 'Tôi không hiểu yêu cầu của bạn. Vui lòng cung cấp thông tin rõ ràng hơn về bất động sản bạn muốn tìm!', 
            posts: [] 
          });
          return;
        }
        const posts = await ChatService.getPostsByConditions(conditions);
        const responseMessage = posts.length > 0 
          ? 'Danh sách bài đăng phù hợp:' 
          : 'Không tìm thấy bài đăng nào phù hợp.';
        
        socket.emit('chatResponse', {
          posts: Array.isArray(posts) ? posts.map((post: any) => post.toJSON()) : [],
          message: responseMessage,
        });
      } catch (error) {
        console.error('Error in chat:', error);
        socket.emit('chatResponse', { message: 'Có lỗi xảy ra', posts: [] });
      }
      console.log("check");
    });

    socket.on('disconnect', () => {
      console.log(`❌ Chat client disconnected: ${socket.id}`);
    });
  });
};