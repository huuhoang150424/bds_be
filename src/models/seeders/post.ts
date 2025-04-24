import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Post, ListingType, PropertyType, Image, Tag, TagPost, User, UserView } from "@models";

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

    const listingType = await ListingType.findOne() || await ListingType.create({
      id: uuidv4(),
      name: "For Sale",
    });

    let tag = await Tag.findOne({ where: { tagName: "Nhà đất bán" } });
    if (!tag) {
      tag = await Tag.create({ id: uuidv4(), tagName: "Nhà đất bán" });
    }

    const imageUrls = Array.from({ length: 8 }, () => faker.image.urlLoremFlickr({ category: "house" }));

    const postsData = [];
    for (const [userIndex, user] of users.entries()) {
      for (let i = 0; i < 20; i++) {
        const street = faker.location.street();
        const district = faker.location.city();
        const houseNumber = faker.number.int({ min: 1, max: 200 });

        postsData.push({
          id: uuidv4(),
          userId: user.id,
          title: `Bán ${faker.helpers.arrayElement(["căn hộ", "nhà phố", "biệt thự"])} tại ${street}, ${district}`,
          priceUnit: "VND",
          address: `${houseNumber} ${street}, ${district}, Hà Nội`,
          price: faker.number.int({ min: 4000000000, max: 8000000000 }),
          squareMeters: faker.number.int({ min: 80, max: 130 }),
          description: faker.lorem.paragraph(),
          floor: faker.number.int({ min: 1, max: 20 }),
          bedroom: faker.number.int({ min: 1, max: 4 }),
          bathroom: faker.number.int({ min: 1, max: 3 }),
          priority: faker.number.int({ min: 0, max: 3 }),
          isFurniture: faker.datatype.boolean(),
          direction: faker.helpers.arrayElement(["Bắc", "Nam", "Đông", "Tây"]),
          verified: faker.datatype.boolean({ probability: 0.8 }),
          status: faker.helpers.arrayElement(["Còn trống", "Đang đàm phán", "Đã bàn giao"]),
          slug: `ban-${faker.helpers.slugify(street)}-${faker.helpers.slugify(district)}-${user.id}-${i + 1}`,
          expiredDate: new Date(Date.now() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000),
        });
      }
    }
    const batchSize = 50;
    for (let i = 0; i < postsData.length; i += batchSize) {
      const batch = postsData.slice(i, i + batchSize);
      const posts = await Post.bulkCreate(batch, { validate: true });

      const propertyTypes = [];
      const images:any = [];
      const tagPosts = [];

      for (const post of posts) {
        propertyTypes.push({
          id: uuidv4(),
          listingTypeId: listingType.id,
          postId: post.id,
          name: faker.helpers.arrayElement(["Căn hộ", "Nhà phố", "Biệt thự"]),
        });

        imageUrls.forEach((url) => {
          images.push({
            id: uuidv4(),
            postId: post.id,
            imageUrl: url,
          });
        });

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
    }

    console.log("Hoàn tất tạo 2000 bài đăng!");
  } catch (error) {
    console.error("Lỗi khi chạy seederPost:", error);
  }
};

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