import { v4 as uuidv4 } from "uuid";
import { Rating, User, Post } from "@models";

export const seedRatings = async () => {
  const users = await User.findAll({ attributes: ["id"] });
  const posts = await Post.findAll({ attributes: ["id"] });

  if (users.length === 0 || posts.length === 0) {
    console.error("❌ Không tìm thấy người dùng hoặc bài đăng nào. Hãy seed Users và Posts trước!");
    return;
  }

  const ratingsToInsert = [];
  for (let i = 0; i < 100; i++) {
    ratingsToInsert.push({
      id: uuidv4(),
      userId: users[Math.floor(Math.random() * users.length)].id,
      postId: posts[Math.floor(Math.random() * posts.length)].id,
      rating: Math.floor(Math.random() * 5) + 1, 
    });
  }

  await Rating.bulkCreate(ratingsToInsert);
  console.log("✅ Ratings seeded successfully!");
};
