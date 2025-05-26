import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Rating, User, Post } from "@models";

export const seedRatings = async () => {
  try {
    const users = await User.findAll({ attributes: ["id"] });
    const posts = await Post.findAll({ attributes: ["id"] });

    if (users.length === 0 || posts.length === 0) {
      return;
    }

    const ratingsToInsert = [];
    for (let i = 0; i < 100; i++) {
      ratingsToInsert.push({
        id: uuidv4(),
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        rating: faker.number.int({ min: 1, max: 5 }),
      });
    }

    console.log(`Chuẩn bị tạo ${ratingsToInsert.length} đánh giá...`);

    const batchSize = 1000; 
    for (let i = 0; i < ratingsToInsert.length; i += batchSize) {
      const batch = ratingsToInsert.slice(i, i + batchSize);
      await Rating.bulkCreate(batch, { validate: true });
      console.log(`Đã tạo batch ${i / batchSize + 1}/${Math.ceil(ratingsToInsert.length / batchSize)}`);
    }

    console.log("✅ Ratings seeded successfully!");
  } catch (error) {
    console.error("Lỗi khi chạy seedRatings:", error);
  }
};