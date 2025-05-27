import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Report, User, Post } from "@models";
import { ReportReason, ProcessingStatus, SeverityStatus } from "@models/enums";

export const seedReport = async () => {
  try {
    const users = await User.findAll({ attributes: ["id"] });
    const posts = await Post.findAll({ attributes: ["id"] });

    if (users.length === 0 || posts.length === 0) {
      console.warn("Không có user hoặc post nào để tạo báo cáo.");
      return;
    }

    const reportReasons = Object.values(ReportReason);
    const reportStatuses = Object.values(ProcessingStatus);
    const severityLevels = Object.values(SeverityStatus);
    const total = 5000;
    const batchSize = 1000;

    for (let i = 0; i < total; i += batchSize) {


      const batch = Array.from({ length: batchSize }).map(() => ({
        id: uuidv4(),
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        reason: faker.helpers.arrayElement(reportReasons),
        content: faker.lorem.sentence({ min: 5, max: 15 }),
        status: faker.helpers.arrayElement(reportStatuses),
        severity: faker.helpers.arrayElement(severityLevels),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      }));
      

      await Report.bulkCreate(batch, { validate: true });
      console.log(`✅ Inserted ${i + batchSize} / ${total}`);
    }

    console.log("✅ Seeded 100.000 báo cáo thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi chạy seedReport:", error);
  }
};
