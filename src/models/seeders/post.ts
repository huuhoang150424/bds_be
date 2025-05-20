import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { Post, ListingType, PropertyType, Image, Tag, TagPost, User, UserView, PostDraft } from '@models';
import { cities } from '@config/constant/adress';
import { propertyLinks } from '@config/constant/image';

interface City {
  name: string;
  weight: number;
  districts: string[];
  streets: string[];
  wards: { [district: string]: string[] };
}

interface Address {
  address: string;
  city: string;
  district: string;
  ward: string;
  street: string;
}

interface PriceRange {
  min: number;
  max: number;
}

interface BasePrice {
  [key: string]: PriceRange;
}

const generateAddress = (): Address => {
  if (!cities || !Array.isArray(cities)) {
    throw new Error('Cities data is not defined or not an array');
  }

  const cityData: City = faker.helpers.weightedArrayElement(
    cities.map((city: any) => ({
      value: city,
      weight: city.weight,
    })),
  );
  const district: string = faker.helpers.arrayElement(cityData.districts);
  const street: string = faker.helpers.arrayElement(cityData.streets);
  const ward: string = cityData.wards[district]
    ? faker.helpers.arrayElement(cityData.wards[district])
    : 'Phường/Xã bất kỳ';
  const houseNumber: number = faker.number.int({ min: 1, max: 200 });
  return {
    address: `Số ${houseNumber} ${street}, ${ward}, ${district}, ${cityData.name}`,
    city: cityData.name,
    district,
    ward,
    street,
  };
};

const getPriceRange = (propertyType: string, city: string): PriceRange => {
  const basePrice: BasePrice = {
    'Căn hộ chung cư': { min: 1000000000, max: 6000000000 },
    'Nhà phố': { min: 2000000000, max: 10000000000 },
    'Biệt thự': { min: 4000000000, max: 12000000000 },
    'Đất nền': { min: 1000000000, max: 8000000000 },
  };
  const multiplier: number = city === 'Hà Nội' || city === 'TP. Hồ Chí Minh' ? 1.2 : 1;
  return {
    min: basePrice[propertyType].min * multiplier,
    max: Math.min(basePrice[propertyType].max * multiplier, 12000000000),
  };
};

const generateDescription = ({
  propertyType,
  address,
  squareMeters,
  bedroom,
  bathroom,
  direction,
  price,
  listingType,
}: any) => {
  return `
    <div class="property-description">
      <h2>${listingType} ${propertyType} tại ${address}</h2>
      <p><strong>Diện tích:</strong> ${squareMeters} m²</p>
      ${bedroom ? `<p><strong>Số phòng ngủ:</strong> ${bedroom}</p>` : ''}
      ${bathroom ? `<p><strong>Số phòng tắm:</strong> ${bathroom}</p>` : ''}
      <p><strong>Hướng:</strong> ${direction}</p>
      <p><strong>Giá:</strong> ${price.toLocaleString('vi-VN')} VND</p>
      <p>Mô tả: Đây là một ${propertyType.toLowerCase()} hiện đại, vị trí đắc địa tại trung tâm ${address.split(',')[3]}. Gần các tiện ích như trường học, bệnh viện, trung tâm thương mại. Phù hợp để ở hoặc đầu tư.</p>
      <p><strong>Liên hệ:</strong> ${faker.phone.number()}</p>
      <a href="mailto:${faker.internet.email()}">Gửi email để biết thêm chi tiết</a>
    </div>
  `;
};

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

    const listingType = (await ListingType.findOne()) || (await ListingType.create({ id: uuidv4(), name: 'Bán' }));

    let tag = await Tag.findOne({ where: { tagName: 'Nhà đất bán' } });
    if (!tag) {
      tag = await Tag.create({ id: uuidv4(), tagName: 'Nhà đất bán' });
    }

    const totalPosts = 10000;
    const batchSize = 100;

    for (let batchIndex = 0; batchIndex < totalPosts / batchSize; batchIndex++) {
      console.log(`Processing batch ${batchIndex + 1}/${totalPosts / batchSize}`);

      const postsData = [];
      for (let i = 0; i < batchSize; i++) {
        const postIndex = batchIndex * batchSize + i;
        const user = faker.helpers.arrayElement(users);
        const { address, city, district, ward, street } = generateAddress();
        const propertyType = faker.helpers.arrayElement(['Căn hộ chung cư', 'Nhà phố', 'Biệt thự', 'Đất nền']);
        const listingTypeName = faker.helpers.arrayElement(['Bán', 'Cho thuê']);
        const priceRange = getPriceRange(propertyType, city);
        const price = faker.number.int(priceRange);
        const squareMeters = faker.number.int({
          min: propertyType === 'Đất nền' ? 100 : 50,
          max: 300,
        });
        const bedroom = propertyType === 'Đất nền' ? null : faker.number.int({ min: 1, max: 5 });
        const bathroom = propertyType === 'Đất nền' ? null : faker.number.int({ min: 1, max: 4 });
        const direction = faker.helpers.arrayElement([
          'Bắc', 'Nam', 'Đông', 'Tây', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam',
        ]);

        postsData.push({
          id: uuidv4(),
          userId: user.id,
          title: `${listingTypeName} ${propertyType} tại ${street}, ${district}, ${city}`,
          priceUnit: 'VND',
          address,
          price,
          squareMeters,
          description: generateDescription({
            propertyType,
            address,
            squareMeters,
            bedroom,
            bathroom,
            direction,
            price,
            listingType: listingTypeName,
          }),
          floor: propertyType === 'Căn hộ chung cư' ? faker.number.int({ min: 1, max: 30 }) : null,
          bedroom,
          bathroom,
          priority: faker.number.int({ min: 0, max: 3 }),
          isFurniture: faker.datatype.boolean(),
          direction,
          verified: faker.datatype.boolean({ probability: 0.8 }),
          status: faker.helpers.arrayElement(['Còn trống', 'Đang đàm phán', 'Đã bàn giao']),
          slug: `${listingTypeName.toLowerCase()}-${street.substring(0, 10)}-${district.substring(0, 10)}-${user.id.substring(0, 8)}-${postIndex}`,
          expiredDate: new Date(Date.now() + faker.number.int({ min: 1, max: 30 }) * 86400000),
        });
      }

      console.log(`Creating ${postsData.length} posts...`);
      const posts = await Post.bulkCreate(postsData, { validate: true });

      const propertyTypes = [];
      const images = [];
      const tagPosts = [];

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];

        const propertyTypeName = post.title.includes('Căn hộ')
          ? 'Căn hộ chung cư'
          : post.title.includes('Nhà phố')
            ? 'Nhà phố'
            : post.title.includes('Biệt thự')
              ? 'Biệt thự'
              : 'Đất nền';

        propertyTypes.push({
          id: uuidv4(),
          listingTypeId: listingType.id,
          postId: post.id,
          name: propertyTypeName,
        });

        tagPosts.push({
          id: uuidv4(),
          postId: post.id,
          tagId: tag.id,
        });

        const imageCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < imageCount; j++) {
          const imageUrl = faker.helpers.arrayElement(propertyLinks);
          images.push({
            id: uuidv4(),
            postId: post.id, 
            postDraftId: null,
            imageUrl,
          });
        }
      }

      await PropertyType.bulkCreate(propertyTypes, { validate: true });
      console.log(`Created ${propertyTypes.length} property types`);

      await TagPost.bulkCreate(tagPosts, { validate: true });
      console.log(`Created ${tagPosts.length} tag posts`);

      const imageChunkSize = 50;
      for (let i = 0; i < images.length; i += imageChunkSize) {
        const imageChunk = images.slice(i, i + imageChunkSize);
        await Image.bulkCreate(imageChunk, { validate: true });
        console.log(`Created images batch ${Math.floor(i / imageChunkSize) + 1}/${Math.ceil(images.length / imageChunkSize)}`);
      }

      console.log(`Completed batch ${batchIndex + 1}/${totalPosts / batchSize}`);
    }

    console.log('🎉 Hoàn tất tạo bài đăng!');
  } catch (error) {
    console.error('Lỗi khi chạy seederPost:', error);
    throw error;
  }
};

export const seedUserViews = async () => {
  try {
    const users = await User.findAll();
    const posts = await Post.findAll();

    if (users.length === 0 || posts.length === 0) {
      console.log('Cần có ít nhất một user và một post trong database.');
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

    console.log('Hoàn tất tạo lượt xem!');
  } catch (error) {
    console.error('Lỗi khi chạy seedUserViews:', error);
    throw error;
  }
};