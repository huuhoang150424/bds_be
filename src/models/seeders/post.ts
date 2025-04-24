import { v4 as uuidv4 } from "uuid";
import { Post, ListingType, PropertyType, Image, Tag, TagPost, User, UserView } from "@models";


export const seederPost = async () => {
  const users = await User.findAll({ attributes: ["id"] }); // 🔥 Lấy tất cả users
  const listingType = await ListingType.findOne();

  if (!users.length || !listingType) {
    console.error("❌ Không tìm thấy danh sách người dùng hoặc loại hình BĐS.");
    return;
  }

  let tag = await Tag.findOne({ where: { tagName: "Nhà đất bán" } });
  if (!tag) {
    tag = await Tag.create({ id: uuidv4(), tagName: "Nhà đất bán" });
  }

  const districts = [
    "Ba Đình", "Hoàn Kiếm", "Đống Đa", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân",
    "Tây Hồ", "Long Biên", "Hoàng Mai", "Hà Đông"
  ];

  const streets = [
    "Phố Huế", "Nguyễn Trãi", "Giải Phóng", "Láng", "Kim Mã", "Tây Sơn",
    "Trần Duy Hưng", "Nguyễn Chí Thanh", "Cầu Giấy", "Hồ Tùng Mậu"
  ];

  const postsData = Array.from({ length: 100 }, (_, i) => {
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const houseNumber = Math.floor(Math.random() * 200) + 1; 
    const randomUser = users[Math.floor(Math.random() * users.length)]; // 🔥 Chọn user ngẫu nhiên

    return {
      id: uuidv4(),
      userId: randomUser.id, // 🔥 Gán user ngẫu nhiên
      title: `Căn hộ cao cấp ${randomStreet}, ${randomDistrict}`,
      priceUnit: "VND",
      address: `${houseNumber} ${randomStreet}, ${randomDistrict}, Hà Nội`,
      price: 4000000000 + Math.random() * 4000000000,
      squareMeters: 80 + Math.floor(Math.random() * 50),
      description: "Căn hộ sang trọng, đầy đủ nội thất, vị trí trung tâm.",
      floor: Math.floor(Math.random() * 20) + 1,
      bedroom: Math.floor(Math.random() * 3) + 1,
      bathroom: Math.floor(Math.random() * 2) + 1,
      priority: Math.floor(Math.random() * 4),
      isFurniture: Math.random() > 0.5,
      direction: ["Bắc", "Nam", "Đông", "Tây"][Math.floor(Math.random() * 4)],
      verified: Math.random() > 0.2,
      status: ["Còn trống", "Đang đàm phán", "Đã bàn giao"][Math.floor(Math.random() * 3)],
      slug: `can-ho-cao-cap-${randomStreet.toLowerCase().replace(/\s+/g, '-')}-${randomDistrict.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      expiredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  });

  await Post.bulkCreate(postsData);
};


export const seedUserViews = async () => {
  const users = await User.findAll();
  const posts = await Post.findAll();

  if (users.length === 0 || posts.length === 0) {
    console.log("Cần có ít nhất một user và một post trong database.");
    return;
  }

  const userViewsData = [];
  for (let i = 0; i < 2000; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    const viewedAt = new Date(
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
    );
    userViewsData.push({
      viewId: i + 1,
      userId: randomUser.id,
      postId: randomPost.id,
      viewedAt,
    });
  }
  await UserView.bulkCreate(userViewsData);
};