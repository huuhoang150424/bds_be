import { v4 as uuidv4 } from "uuid";
import { Post, ListingType, PropertyType, Image, Tag, TagPost, User, UserView } from "@models";

export const seederPost = async () => {
  const user = await User.findOne();
  const listingType = await ListingType.findOne();

  if (!user || !listingType) {
    console.log("Cần có ít nhất một user và một listing type trong database.");
    return;
  }

  const postsData = Array.from({ length: 100 }, (_, i) => {
    const district = Math.floor(Math.random() * 10) + 1; // Quận ngẫu nhiên từ 1-10
    return {
      id: uuidv4(),
      userId: user.id,
      title: `Căn hộ cao cấp Quận ${district}`,
      priceUnit: "VND",
      address: `123 Nguyễn Trãi, Quận ${district}, TP. Hồ Chí Minh`,
      price: 4000000000 + Math.random() * 4000000000, 
      squareMeters: 80 + Math.floor(Math.random() * 50), 
      description: "Căn hộ sang trọng, đầy đủ nội thất, vị trí trung tâm.",
      floor: Math.floor(Math.random() * 20) + 1,
      bedroom: Math.floor(Math.random() * 3) + 1,
      bathroom: Math.floor(Math.random() * 2) + 1, 
      priority: Math.floor(Math.random() * 5), 
      isFurniture: Math.random() > 0.5, 
      direction: ["Bắc", "Nam", "Đông", "Tây"][Math.floor(Math.random() * 4)],
      verified: Math.random() > 0.2, // 80% được xác minh
      status: ["Còn trống", "Đang đàm phán", "Đã bàn giao"][Math.floor(Math.random() * 3)],
      slug: `can-ho-cao-cap-quan-${district}-${i + 1}`,
      expiredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  });

  for (const postData of postsData) {
    const post = await Post.create(postData);
    await PropertyType.create({
      id: uuidv4(),
      listingTypeId: listingType.id,
      postId: post.id,
      name: ["Căn hộ", "Nhà phố", "Biệt thự"][Math.floor(Math.random() * 3)],
    });
    await Image.bulkCreate([
      {
        id: uuidv4(),
        postId: post.id,
        imageUrl:
          "https://lh3.googleusercontent.com/proxy/sample-image-url",
      },
    ]);
    const tag = await Tag.create({ id: uuidv4(), tagName: "Hot" });
    await TagPost.create({ id: uuidv4(), postId: post.id, tagId: tag.id });
  }
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