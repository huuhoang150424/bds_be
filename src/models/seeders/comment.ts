import { v4 as uuidv4 } from "uuid";
import { Comment , User } from "@models";

export const seedComment = async () => {
  const users = await User.findAll({ attributes: ["id"] });

  if (users.length === 0) {
    console.error("❌ Không tìm thấy người dùng nào. Hãy seed Users trước!");
    return;
  }

  const commentsData = [
    "Bình luận này rất thú vị!",
    "Cảm ơn vì đã chia sẻ!",
    "Ai có thêm thông tin về chủ đề này không?",
    "Tôi đồng ý với quan điểm trên.",
    "Mình thấy bài viết rất hữu ích!",
  ];

  const commentsToInsert = [];
  for (let i = 0; i < 50; i++) {
    commentsToInsert.push({
      id: uuidv4(),
      userId: users[Math.floor(Math.random() * users.length)].id,
      content: commentsData[Math.floor(Math.random() * commentsData.length)],
    });
  }

  await Comment.bulkCreate(commentsToInsert);
  console.log("✅ Comments seeded successfully!");
};
