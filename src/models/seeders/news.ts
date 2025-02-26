import News from "@models/news.model";
import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import { CategoryNew } from "@models/enums";

export const seedNews = async () => {
  const users = await User.findAll({ attributes: ["id"] });

  if (users.length === 0) {
    console.error("❌ Không tìm thấy người dùng nào. Hãy seed Users trước!");
    return;
  }

  const newsData = [
    {
      title: "Bất động sản tăng trưởng mạnh đầu năm 2025",
      content: "Thị trường nhà đất đang có dấu hiệu phục hồi...",
      origin_post: "Nguồn: Báo Kinh Tế",
      imageUrl: "https://vnn-imgs-a1.vgcloud.vn/icdn.dantri.com.vn/2021/05/08/kimoanh-851-1620472406599.jpeg",
      category: CategoryNew.Market,
      readingTime: 5,
    },
    {
      title: "Xu hướng mua nhà của giới trẻ",
      content: "Giới trẻ ngày nay có xu hướng chọn chung cư hơn...",
      origin_post: "Nguồn: VnExpress",
      imageUrl: "https://chamsua.vn/wp-content/uploads/2024/12/300anh-gai-xinh-toc-ngang-vai-2k2-2k3-2k4-2k6-2k7-2k9-tuyen-5-1.jpg",
      category: CategoryNew.Policy,
      readingTime: 7,
    },
    {
      title: "Những khu vực đáng đầu tư năm 2025",
      content: "Các chuyên gia dự báo các khu vực tiềm năng...",
      origin_post: "Nguồn: Bất động sản Today",
      imageUrl: "https://pixwares.com/storage/2023/07/anh-gai-xinh.jpg",
      category: CategoryNew.Other,
      readingTime: 6,
    },
  ];

  for (const newsItem of newsData) {
    await News.findOrCreate({
      where: { title: newsItem.title },
      defaults: {
        id: uuidv4(),
        userId: users[Math.floor(Math.random() * users.length)].id,
        ...newsItem,
      },
    });
  }

  console.log("✅ News seeded successfully!");
};
