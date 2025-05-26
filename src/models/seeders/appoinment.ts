import { v4 as uuidv4 } from "uuid";
import { Faker, vi as viLocale } from "@faker-js/faker";
import User from "@models/user.model";
import Post from "@models/post.model";
import { AppointmentStatus } from "@models/enums";
import Appointment from "@models/appointments.model";

const faker = new Faker({ locale: viLocale });

export const seedAppointments = async () => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const users = await User.findAll();
    if (!users || users.length < 2) {
      throw new Error("Cần ít nhất 2 người dùng để tạo lịch hẹn.");
    }

    const posts = await Post.findAll();
    if (!posts || posts.length === 0) {
      throw new Error("Cần ít nhất 1 bài đăng để tạo lịch hẹn.");
    }

    const statuses = Object.values(AppointmentStatus);
    const appointments: Partial<Appointment>[] = [];
    const batchSize = 100; // Chia nhỏ lô để tránh quá tải
    const maxAppointmentsPerUser = 5; // Giảm số lịch hẹn mỗi người dùng để tránh tạo quá nhiều

    // Mẫu tin nhắn liên quan đến bất động sản
    const messageTemplates = [
      (post: Post) => `Tôi muốn hẹn xem "${post.title}" vào cuối tuần này.`,
      (post: Post) => `Vui lòng sắp xếp lịch xem bất động sản "${post.title}" tại ${post.address}.`,
      (post: Post) => `Tôi quan tâm đến "${post.title}". Có thể gặp để thảo luận chi tiết không?`,
      (post: Post) => `Yêu cầu hẹn để kiểm tra pháp lý của "${post.title}".`,
      (post: Post) => `Liên hệ để xem "${post.title}" và thảo luận giá cả.`,
    ];

    // Tạo lịch hẹn
    for (const requester of users) {
      // Chỉ tạo lịch hẹn cho người dùng có vai trò User hoặc Agent
      if (requester.roles === "Admin") continue;

      for (let i = 0; i < maxAppointmentsPerUser; i++) {
        let receiver = faker.helpers.arrayElement(users);
        while (receiver.id === requester.id || receiver.roles === "Admin") {
          receiver = faker.helpers.arrayElement(users); // Đảm bảo requester và receiver khác nhau, không là Admin
        }

        const post = faker.helpers.arrayElement(posts);
        const createdAt = faker.date.past({ years: 1 });
        const appointmentTime = faker.date.soon({ days: 30, refDate: createdAt });

        appointments.push({
          id: uuidv4(),
          requesterId: requester.id,
          receiverId: receiver.id,
          postId: post.id,
          appointmentTime,
          duration: faker.number.int({ min: 15, max: 60 }),
          status: faker.helpers.arrayElement(statuses),
          message: faker.helpers.arrayElement(messageTemplates)(post), // Sử dụng mẫu tin nhắn
          createdAt,
          updatedAt: new Date(),
        });
      }
    }

    // Phân lô để chèn dữ liệu
    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      await Appointment.bulkCreate(batch, { validate: true });
      console.log(`✅ Đã tạo ${i + batch.length}/${appointments.length} lịch hẹn`);
    }

    console.log("🎉 Hoàn tất tạo lịch hẹn!");
  } catch (error) {
    console.error("Lỗi khi chạy seedAppointments:", error);
    throw error;
  }
};