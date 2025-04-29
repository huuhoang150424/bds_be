import {Banner} from "@models";
import { v4 as uuidv4 } from "uuid";

export const seedBanners = async () => {
  const banners = [
    {
      title: "Khuyến mãi Tết 2025",
      imageUrls: [
        "https://treobangron.com.vn/wp-content/uploads/2023/07/bannerbatdongsan06-1.jpg",
        "https://maxweb.vn/wp-content/uploads/2020/05/banner-bat-dong-san-dep-05.jpg"
      ],
      targetUrl: "https://example.com/tet2025",
      displayOrder: 1,
      isActive: true,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-02-01")
    },
    {
      title: "Flash Sale 12.12",
      imageUrls: [
        "https://nikedu.vn/wp-content/uploads/2021/10/banner-bat-dong-san-3.jpg"
      ],
      targetUrl: "https://example.com/flashsale",
      displayOrder: 2,
      isActive: true,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-12")
    },
    ...Array.from({ length: 50 }, (_, i) => ({
      title: `Banner ${i + 1}`,
      imageUrls: [
        `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_umzpKRxONJfgaZoxkYMRUR5XWfYHkUxOpCoWM3dehKAa7XkV_itqdXAA9UFPBJdFFr4&usqp=CAU`,
        "https://treobangron.com.vn/wp-content/uploads/2023/07/bannerbatdongsan06-1.jpg",
        "https://maxweb.vn/wp-content/uploads/2020/05/banner-bat-dong-san-dep-05.jpg",
        "https://nikedu.vn/wp-content/uploads/2021/10/banner-bat-dong-san-3.jpg"
      ],
      targetUrl: `https://example.com/random-${i + 1}`,
      displayOrder: i + 3,
      isActive: Math.random() > 0.3,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    }))
  ];

  await Promise.all(
    banners.map(async (banner) => {
      await Banner.findOrCreate({
        where: { title: banner.title },
        defaults: {
          id: uuidv4(),
          ...banner,
        }
      });
    })
  );
};
