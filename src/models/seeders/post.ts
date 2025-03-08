import {Post,ListingType,PropertyType,Image,Tag,TagPost,User} from "@models";
import { v4 as uuidv4 } from "uuid";


export const seederPost = async () => {
  const user = await User.findOne();
  const listingType = await ListingType.findOne();
  
  if (!user || !listingType) {
    console.log("Cần có ít nhất một user và một listing type trong database.");
    return;
  }
  const postsData = [
    {
      id: uuidv4(),
      userId: user.id,
      title: "Căn hộ cao cấp Quận 1",
      priceUnit: "VND",
      address: "123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
      price: 5000000000,
      squareMeters: 100,
      description: "Căn hộ sang trọng, đầy đủ nội thất, vị trí trung tâm.",
      floor: 10,
      bedroom: 3,
      bathroom: 2,
      priority: 0,
      isFurniture: true,
      direction: "Bắc",
      verified: true,
      status: "Còn trống",
      slug: "can-ho-cao-cap-quan-1",
      expiredDate: new Date(),
    },
		{
      id: uuidv4(),
      userId: user.id,
      title: "Căn hộ cao cấp Quận 2",
      priceUnit: "VND",
      address: "123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
      price: 5000000000,
      squareMeters: 100,
      description: "Căn hộ sang trọng, đầy đủ nội thất, vị trí trung tâm.",
      floor: 10,
      bedroom: 3,
      bathroom: 2,
      priority: 0,
      isFurniture: true,
      direction: "Bắc",
      verified: true,
      status: "Còn trống",
      slug: "can-ho-cao-cap-quan-2",
      expiredDate: new Date(),
    },
		{
      id: uuidv4(),
      userId: user.id,
      title: "Căn hộ cao cấp Quận 5",
      priceUnit: "VND",
      address: "123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
      price: 5000000000,
      squareMeters: 100,
      description: "Căn hộ sang trọng, đầy đủ nội thất, vị trí trung tâm.",
      floor: 10,
      bedroom: 3,
      bathroom: 2,
      priority: 0,
      isFurniture: true,
      direction: "Bắc",
      verified: true,
      status: "Còn trống",
      slug: "can-ho-cao-cap-quan-5",
      expiredDate: new Date(),
    },
    {
      id: uuidv4(),
      userId: user.id,
      title: "Nhà phố quận 7, gần Phú Mỹ Hưng",
      priceUnit: "VND",
      address: "456 Lê Văn Lương, Quận 7, TP. Hồ Chí Minh",
      price: 7000000000,
      squareMeters: 120,
      description: "Nhà phố đẹp, thuận tiện di chuyển, gần nhiều tiện ích.",
      floor: 3,
      bedroom: 4,
      bathroom: 3,
      priority: 0,
      isFurniture: false,
      direction: "Nam",
      verified: false,
      status: "Đang đàm phán",
      slug: "nha-pho-quan-7",
      expiredDate: new Date(),
    },
  ];

  for (const postData of postsData) {
    const post = await Post.create(postData);
    await PropertyType.create({
      id: uuidv4(),
      listingTypeId: listingType.id,
      postId: post.id,
      name: "Căn hộ",
    });
    await Image.bulkCreate([
      { id: uuidv4(), postId: post.id, imageUrl: "seederPosthttps://lh3.googleusercontent.com/proxy/LZHzJEBYK9pnsCDKVabhgucdOg-E4Jr9H73t3qqEq61QpuE6AyY89fPQ9vc9oi_ldhz6cbFuG2IsmtqztOXT9pZDIsCS9cUizjo7F8embUK3BG7nY1iWktJNoGOwM32PImjh2ooi8MVg3g" },
      { id: uuidv4(), postId: post.id, imageUrl: "seederPosthttps://lh3.googleusercontent.com/proxy/LZHzJEBYK9pnsCDKVabhgucdOg-E4Jr9H73t3qqEq61QpuE6AyY89fPQ9vc9oi_ldhz6cbFuG2IsmtqztOXT9pZDIsCS9cUizjo7F8embUK3BG7nY1iWktJNoGOwM32PImjh2ooi8MVg3g" },
    ]);
    const tag = await Tag.create({ id: uuidv4(), tagName: "Hot" });
    await TagPost.create({ id: uuidv4(), postId: post.id, tagId: tag.id });
  }
};



