import { v4 as uuidv4 } from "uuid";
import { Report, User, Post } from "@models";

export const seedReport = async () => {
  const users = await User.findAll({ attributes: ["id"] });
  const posts = await Post.findAll({ attributes: ["id"] });

  if (users.length === 0 || posts.length === 0) {
    console.error("❌ Không tìm thấy người dùng hoặc bài đăng nào. Hãy seed Users và Posts trước!");
    return;
  }

  const reasons = [
    "Nội dung sai sự thật",
    "Hình ảnh không phù hợp",
    "Lừa đảo",
    "Spam",
    "Vi phạm bản quyền",
  ];

  const reportsToInsert = [];
  for (let i = 0; i < 50; i++) {
    reportsToInsert.push({
      id: uuidv4(),
      userId: users[Math.floor(Math.random() * users.length)].id,
      postId: posts[Math.floor(Math.random() * posts.length)].id,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      content: "Nội dung báo cáo tự động.",
    });
  }

  await Report.bulkCreate(reportsToInsert);
  console.log("✅ Reports seeded successfully!");
};
