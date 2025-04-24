import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Wishlist, User, Post } from "@models";

export const seedWishlists = async () => {
  try {
    const users = await User.findAll({ attributes: ["id"] });
    const posts = await Post.findAll({ attributes: ["id"] });

    if (users.length === 0 || posts.length === 0) {
      return;
    }

    const wishlistsData = [];
    for (let i = 0; i < 500; i++) {
      wishlistsData.push({
        id: uuidv4(),
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        createdAt: new Date(Date.now() - faker.number.int({ min: 0, max: 30 }) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - faker.number.int({ min: 0, max: 30 }) * 24 * 60 * 60 * 1000),
      });
    }


    const batchSize = 100;
    for (let i = 0; i < wishlistsData.length; i += batchSize) {
      const batch = wishlistsData.slice(i, i + batchSize);
      await Wishlist.bulkCreate(batch, { validate: true });
    }

    console.log("✅ Wishlists seeded successfully!");
  } catch (error) {
    console.error("Lỗi khi chạy seedWishlists:", error);
  }
};