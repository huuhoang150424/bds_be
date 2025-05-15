import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import {
  Post,
  ListingType,
  PropertyType,
  Image,
  Tag,
  TagPost,
  User,
	UserView,
} from "@models";

// Danh sách quận và đường phố Hà Nội
const hanoiDistricts = [
  "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Cầu Giấy", "Thanh Xuân",
  "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
];

const hanoiStreets = [
  "Láng Hạ", "Kim Mã", "Nguyễn Chí Thanh", "Trần Duy Hưng", "Hoàng Đạo Thúy",
  "Giảng Võ", "Đội Cấn", "Phan Đình Phùng", "Hàng Bông", "Lý Thường Kiệt",
  "Nguyễn Trãi", "Khuất Duy Tiến", "Tố Hữu", "Lê Văn Lương", "Nguyễn Xiển",
];

// Tạo địa chỉ tại Hà Nội
const generateHanoiAddress = () => {
  const district = faker.helpers.arrayElement(hanoiDistricts);
  const street = faker.helpers.arrayElement(hanoiStreets);
  const houseNumber = faker.number.int({ min: 1, max: 200 });
  return {
    address: `Số ${houseNumber} ${street}, ${district}, Hà Nội`,
    city: "Hà Nội",
    district,
    street,
  };
};

// Hà Nội có range giá cao
const getPriceRange = () => ({ min: 3000000000, max: 15000000000 });

// Hàm chính để seed 10.000 bài đăng
export const seederPost = async () => {
  try {
    let users = await User.findAll({ limit: 100 });
    if (users.length < 100) {
      console.log(`Chỉ có ${users.length} user, đang tạo thêm...`);
      const newUsers = Array.from({ length: 100 - users.length }, () => ({
        id: uuidv4(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      }));
      await User.bulkCreate(newUsers);
      users = await User.findAll({ limit: 100 });
    }

    // Listing Type và Tag
    const listingType =
      (await ListingType.findOne()) ||
      (await ListingType.create({ id: uuidv4(), name: "Bán" }));

    let tag = await Tag.findOne({ where: { tagName: "Nhà đất bán" } });
    if (!tag) {
      tag = await Tag.create({ id: uuidv4(), tagName: "Nhà đất bán" });
    }

    // Dữ liệu bài đăng
    const totalPosts = 10000;
    const batchSize = 100;
    const postsData = [];

    for (let i = 0; i < totalPosts; i++) {
      const user = faker.helpers.arrayElement(users);
      const { address, city, district, street } = generateHanoiAddress();
      const propertyType = faker.helpers.arrayElement([
        "Căn hộ chung cư", "Nhà phố", "Biệt thự", "Đất nền",
      ]);
      const priceRange = getPriceRange();

      postsData.push({
        id: uuidv4(),
        userId: user.id,
        title: `Bán ${propertyType} tại ${street}, ${district}, Hà Nội`,
        priceUnit: "VND",
        address,
        price: faker.number.int(priceRange),
        squareMeters: faker.number.int({
          min: propertyType === "Đất nền" ? 100 : 50,
          max: 300,
        }),
        description: faker.lorem.paragraph(),
        floor: propertyType === "Căn hộ chung cư"
          ? faker.number.int({ min: 1, max: 30 })
          : null,
        bedroom: propertyType === "Đất nền"
          ? null
          : faker.number.int({ min: 1, max: 5 }),
        bathroom: propertyType === "Đất nền"
          ? null
          : faker.number.int({ min: 1, max: 4 }),
        priority: faker.number.int({ min: 0, max: 3 }),
        isFurniture: faker.datatype.boolean(),
        direction: faker.helpers.arrayElement([
          "Bắc", "Nam", "Đông", "Tây", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam",
        ]),
        verified: faker.datatype.boolean({ probability: 0.8 }),
        status: faker.helpers.arrayElement([
          "Còn trống", "Đang đàm phán", "Đã bàn giao",
        ]),
        slug: `ban-${faker.helpers.slugify(street)}-${faker.helpers.slugify(district)}-${user.id}-${i + 1}`,
        expiredDate: new Date(Date.now() + faker.number.int({ min: 1, max: 30 }) * 86400000),
      });
    }

    // Tạo theo từng batch
    for (let i = 0; i < postsData.length; i += batchSize) {
      const batch = postsData.slice(i, i + batchSize);
      const posts = await Post.bulkCreate(batch, { validate: true });

      const propertyTypes = [];
      const images = [];
      const tagPosts = [];

      for (const post of posts) {
        const propertyTypeName = faker.helpers.arrayElement([
          "Căn hộ chung cư", "Nhà phố", "Biệt thự", "Đất nền",
        ]);

        propertyTypes.push({
          id: uuidv4(),
          listingTypeId: listingType.id,
          postId: post.id,
          name: propertyTypeName,
        });

        // Ảnh nhà đất (real estate)
        for (let j = 0; j < 8; j++) {
          images.push({
            id: uuidv4(),
            postId: post.id,
            imageUrl: faker.image.urlLoremFlickr({
              category: "realestate",
            }),
          });
        }

        tagPosts.push({
          id: uuidv4(),
          postId: post.id,
          tagId: tag.id,
        });
      }

      await Promise.all([
        PropertyType.bulkCreate(propertyTypes, { validate: true }),
        Image.bulkCreate(images, { validate: true }),
        TagPost.bulkCreate(tagPosts, { validate: true }),
      ]);

      console.log(`Đã tạo ${i + batch.length}/${totalPosts} bài đăng`);
    }

    console.log("🎉 Hoàn tất tạo 10.000 bài đăng chỉ ở Hà Nội!");
  } catch (error) {
    console.error("Lỗi khi chạy seederPost:", error);
  }
};


// Seeder for User Views
export const seedUserViews = async () => {
  try {
    const users = await User.findAll();
    const posts = await Post.findAll();

    if (users.length === 0 || posts.length === 0) {
      console.log("Cần có ít nhất một user và một post trong database.");
      return;
    }

    const userViewsData = Array.from({ length: 5000 }, () => ({
      id: uuidv4(),
      userId: faker.helpers.arrayElement(users).id,
      postId: faker.helpers.arrayElement(posts).id,
      viewedAt: new Date(Date.now() - faker.number.int({ min: 0, max: 30 }) * 24 * 60 * 60 * 1000),
    }));

    console.log(`Chuẩn bị tạo ${userViewsData.length} lượt xem...`);
    const batchSize = 100;
    for (let i = 0; i < userViewsData.length; i += batchSize) {
      const batch = userViewsData.slice(i, i + batchSize);
      await UserView.bulkCreate(batch, { validate: true });
      console.log(`Đã tạo batch ${i / batchSize + 1}/${Math.ceil(userViewsData.length / batchSize)}`);
    }

    console.log("Hoàn tất tạo lượt xem!");
  } catch (error) {
    console.error("Lỗi khi chạy seedUserViews:", error);
  }
};