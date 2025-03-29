import News from "@models/news.model";
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { CategoryNew } from "@models/enums";
import User from "@models/user.model";

export const seedNews = async () => {
  const users = await User.findAll();

  const newsList = [
    {
      title: "NASA Công Bố Kế Hoạch Chinh Phục Sao Hỏa",
      content: "NASA vừa công bố kế hoạch mới nhất để đưa con người lên sao Hỏa vào năm 2030...",
      origin_post: "https://nasa.gov/mars-mission",
      view: 100,
      imageUrl: "https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg",
      category: CategoryNew.Advice,
      readingTime: 5,
    },
    {
      title: "Trí Tuệ Nhân Tạo: Xu Hướng Mới Trong Năm 2025",
      content: "AI đang trở thành xu hướng hàng đầu trong lĩnh vực công nghệ, với nhiều ứng dụng thực tiễn...",
      origin_post: "https://ai-news.com/trend-2025",
      view: 250,
      imageUrl: "https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg",
      category: CategoryNew.Market,
      readingTime: 6,
    },
    ...Array.from({ length: 100 }, (_, i) => {
      const daysAgo = Math.floor(Math.random() * 365); 
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      return {
        title: `Bài viết ${i + 1}`,
        content: `Nội dung của bài viết ${i + 1}`,
        origin_post: `https://example.com/news-${i + 1}`,
        view: Math.floor(Math.random() * 500),
        imageUrl: `https://hnsofa.com/wp-content/uploads/2023/03/chiem-nguong-50-hinh-anh-phong-canh-buon-tam-trang-cuc-dep_15.jpg`,
        category: Object.values(CategoryNew)[i % Object.values(CategoryNew).length],
        readingTime: Math.floor(Math.random() * 10) + 1,
        createdAt: createdAt,
      };
    }),
  ];

  await Promise.all(
    newsList.map(async (news) => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      await News.findOrCreate({
        where: { title: news.title },
        defaults: {
          id: uuidv4(),
          userId: randomUser.id,
          slug: slugify(news.title, { lower: true, strict: true }),
          ...news,
        },
      });
    })
  );
};
