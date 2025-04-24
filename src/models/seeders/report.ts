import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Report, User, Post } from "@models";
import { ReportReason, ProcessingStatus } from "@models/enums";

export const seedReport = async () => {
  try {
    const users = await User.findAll({ attributes: ["id"] });
    const posts = await Post.findAll({ attributes: ["id"] });

    if (users.length === 0 || posts.length === 0) {
      return;
    }

    const reportReasons = Object.values(ReportReason);
    const reportStatuses = Object.values(ProcessingStatus);

    const reportsToInsert = [];
    for (let i = 0; i < 50; i++) {
      reportsToInsert.push({
        id: uuidv4(),
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        reason: faker.helpers.arrayElement(reportReasons),
        content: faker.lorem.sentence({ min: 5, max: 15 }),
        status: faker.helpers.arrayElement(reportStatuses),
      });
    }


    const batchSize = 50; 
    for (let i = 0; i < reportsToInsert.length; i += batchSize) {
      const batch = reportsToInsert.slice(i, i + batchSize);
      await Report.bulkCreate(batch, { validate: true });
    }

    console.log("✅ Reports seeded successfully!");
  } catch (error) {
    console.error("Lỗi khi chạy seedReport:", error);
  }
};