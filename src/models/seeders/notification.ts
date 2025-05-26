import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import Notification from '@models/notification.model';
import User from '@models/user.model';
import Post from '@models/post.model';

export const seedNotifications = async () => {
  try {
    const users = await User.findAll();
    if (!users || users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }

    // Fetch posts to reference in notifications
    const posts = await Post.findAll({ limit: 100 });
    if (!posts || posts.length === 0) {
      console.warn('No posts found. Notifications will not reference specific posts.');
    }

    const notificationTemplates = [
      {
        message: (user: any, post?: any) =>
          `Bài đăng "${post?.title || 'một bất động sản'}" của bạn đã được duyệt thành công!`,
        priority: 3,
      },
      {
        message: (user: any, post?: any) =>
          `Giá bài đăng "${post?.title || 'một bất động sản'}" đã được cập nhật. Vui lòng kiểm tra lại.`,
        priority: 4,
      },
      {
        message: (user: any, post?: any) =>
          `Có một câu hỏi mới về bài đăng "${post?.title || 'một bất động sản'}" từ người dùng khác.`,
        priority: 3,
      },
      {
        message: (user: any) =>
          `Bài đăng của bạn sắp hết hạn vào ${faker.date.soon({ days: 3 }).toLocaleDateString('vi-VN')}. Gia hạn ngay!`,
        priority: 5,
      },
      {
        message: (user: any) =>
          `Chào ${user.username}, có một chương trình khuyến mãi mới cho người dùng VIP. Kiểm tra ngay!`,
        priority: 2,
      },
      {
        message: (user: any) =>
          `Hệ thống vừa cập nhật chính sách mới. Vui lòng đọc chi tiết tại mục thông báo.`,
        priority: 1,
      },
      {
        message: (user: any, post?: any) =>
          `Bài đăng "${post?.title || 'một bất động sản'}" của bạn đã nhận được lượt xem mới!`,
        priority: 2,
      },
      {
        message: (user: any) =>
          `Vui lòng xác minh tài khoản của bạn để tiếp tục đăng bài.`,
        priority: 4,
      },
    ];

    const total = 1000;
    const batchSize = 100;

    for (let i = 0; i < total; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, total - i) }).map(() => {
        const user = faker.helpers.arrayElement(users);
        const post = posts.length > 0 ? faker.helpers.arrayElement(posts) : null;
        const template = faker.helpers.arrayElement(notificationTemplates);
        const createdAt = faker.date.past({ years: 1 });
        const endDate = faker.date.future({ years: 1, refDate: createdAt });

        return {
          id: uuidv4(),
          userId: user.id,
          message: template.message(user, post),
          priority: template.priority,
          isRead: faker.datatype.boolean({ probability: 0.3 }), 
          endDate: endDate,
          createdAt: createdAt,
          updatedAt: new Date(),
        };
      });

      await Notification.bulkCreate(batch, { validate: true });
      console.log(`✅ Đã tạo ${i + batch.length}/${total} thông báo`);
    }

    console.log('🎉 Hoàn tất tạo thông báo!');
  } catch (error) {
    console.error('Lỗi khi chạy seedNotifications:', error);
    throw error;
  }
};