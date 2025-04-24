import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { PostHistory, Post, User } from "@models";
import { ActionType, Directions, StatusPost, PriceUnit } from "@models/enums";

export const seedPostHistory = async () => {
  try {
    const posts = await Post.findAll();
    const users = await User.findAll();

    if (posts.length === 0 || users.length === 0) {
      return;
    }

    const postHistoryData = [];
    const updatesPerPost = 20; 

    for (const post of posts) {
      let currentPrice = post.price;
      let isFirstChange = true;

      for (let i = 0; i < updatesPerPost; i++) {
        const randomUser = faker.helpers.arrayElement(users);
        const changedAt = new Date(Date.now() - faker.number.int({ min: 0, max: 30 }) * 24 * 60 * 60 * 1000);
        const action = isFirstChange ? ActionType.CREATE : ActionType.UPDATE;

        if (action === ActionType.UPDATE) {
          const priceChange = currentPrice * faker.number.float({ min: 0.1, max: 0.2, fractionDigits: 2 });
          const newPrice = faker.datatype.boolean()
            ? currentPrice + priceChange
            : currentPrice - priceChange;
          currentPrice = Math.max(1000000000, Math.round(newPrice)); 
        }

        postHistoryData.push({
          id: uuidv4(),
          postId: post.id,
          userId: randomUser.id,
          priceUnit: post.priceUnit || PriceUnit.VND,
          title: post.title,
          address: post.address,
          price: currentPrice,
          squareMeters: post.squareMeters,
          priority: post.priority || faker.number.int({ min: 0, max: 3 }),
          description:
            action === ActionType.CREATE
              ? faker.lorem.sentence({ min: 5, max: 10 })
              : faker.lorem.sentence({ min: 5, max: 15 }),
          floor: post.floor || faker.number.int({ min: 1, max: 20 }),
          bedroom: post.bedroom || faker.number.int({ min: 1, max: 4 }),
          bathroom: post.bathroom || faker.number.int({ min: 1, max: 3 }),
          isFurniture: post.isFurniture ?? faker.datatype.boolean(),
          slug: post.slug,
          direction: post.direction || faker.helpers.arrayElement(Object.values(Directions)),
          verified: post.verified ?? faker.datatype.boolean({ probability: 0.8 }),
          expiredDate: post.expiredDate || faker.date.soon({ days: 30 }),
          status: post.status || faker.helpers.arrayElement(Object.values(StatusPost)),
          action,
          changeBy: randomUser.id,
          changedAt,
        });

        isFirstChange = false;
      }
    }

    postHistoryData.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

    console.log(`Chuẩn bị tạo ${postHistoryData.length} bản ghi lịch sử bài đăng...`);

    const batchSize = 100;
    for (let i = 0; i < postHistoryData.length; i += batchSize) {
      const batch = postHistoryData.slice(i, i + batchSize);
      await PostHistory.bulkCreate(batch, { validate: true });
    }

    console.log("Hoàn tất tạo lịch sử bài đăng!");
  } catch (error) {
    console.error("Lỗi khi chạy seedPostHistory:", error);
  }
};