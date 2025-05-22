import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { User, Post, Transaction, Rating, Comment, UserPricing, Pricing, PropertyType, Image, Tag, TagPost, ListingType } from '@models';
import { Roles, Gender, Status, PaymentMethod, CommentStatus, PriceUnit } from '@models/enums';
import { addDays } from 'date-fns';
import { Op } from 'sequelize';
import { cities } from '@config/constant/adress';
import { propertyLinks } from '@config/constant/image';
import bcrypt from 'bcrypt';
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

export const seedProfessionalUsers = async () => {
  try {
    const avatars = [
      'https://anhnail.com/wp-content/uploads/2024/10/Hinh-gai-xinh-k8-cute.jpg',
      'https://lh7-rt.googleusercontent.com/docsz/AD_4nXe6g6fUIDLESXqrjVvxPI1BpjGMRmu16pWwI2lafSq4bkfjph9_DSDzxQpVruf5VnftjRKnd3e0bFJTOpLvZnVirb01Bg496jf1tJGhseS5OWEaeyJx4DpeonIHHsH0Jsw-vflitP6EA0X2nN7Vag=s412?key=EaGBO2t3RnOp9uiHUHPIVg',
    ];

    const password = '123456';
    const saltRounds = 10;

    // Hash password for all users
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create two professional users
    const professionalUsersData = [
      {
        id: uuidv4(),
        fullname: 'user1504',
        email: 'user1504@gmail.com',
        password: hashedPassword,
        emailVerified: true,
        phone: '0901234567',
        address: 'Hà Nội',
        gender: Gender.Male,
        dateOfBirth: new Date('1985-05-15'),
        roles: Roles.Agent,
        avatar: avatars[0],
        isProfessional: true,
        balance: 15000000000,
        score: 80,
        selfIntroduction: 'Experienced real estate agent with a focus on luxury properties.',
        experienceYears: '5',
        certificates: 'Real Estate License, Property Management Certificate',
        expertise: ['Luxury Homes', 'Commercial Properties'],
        createdAt: new Date('2023-05-21T10:55:00+07:00'), // 2 years ago
        updatedAt: new Date('2025-05-21T22:55:00+07:00'),
        isLock: false,
        isPermanentlyLocked: false,
      },
      {
        id: uuidv4(),
        fullname: 'user1110',
        email: 'user1110@gmail.com',
        password: hashedPassword,
        emailVerified: true,
        phone: '0907654321',
        address: 'TP. Hồ Chí Minh',
        gender: Gender.Female,
        dateOfBirth: new Date('1990-08-20'),
        roles: Roles.Agent,
        avatar: avatars[1],
        isProfessional: true,
        balance: 15000000000,
        score: 85,
        selfIntroduction: 'Dedicated real estate professional specializing in residential properties.',
        experienceYears: '7',
        certificates: 'Certified Property Manager, Real Estate Broker License',
        expertise: ['Residential Properties', 'Investment Properties'],
        createdAt: new Date('2023-05-21T10:55:00+07:00'), // 2 years ago
        updatedAt: new Date('2025-05-21T22:55:00+07:00'),
        isLock: false,
        isPermanentlyLocked: false,
      },
    ];

    await User.bulkCreate(professionalUsersData);
    console.log('✅ Created 2 professional users (user1504, user1110)');

    // Create additional users for comments and ratings
    const otherUsersData = Array.from({ length: 10 }, (_, i) => ({
      id: uuidv4(),
      fullname: `userh${i + 1}`,
      email: `userh${i + 1}@gmail.com`,
      password: hashedPassword,
      emailVerified: true,
      phone: `09${faker.string.numeric(8)}`,
      address: faker.helpers.arrayElement(['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']),
      gender: faker.helpers.arrayElement(Object.values(Gender)),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }),
      roles: Roles.User,
      avatar: faker.helpers.arrayElement(avatars),
      isProfessional: false,
      balance: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
      score: faker.number.int({ min: 0, max: 100 }),
      createdAt: new Date('2025-05-21T22:55:00+07:00'),
      updatedAt: new Date('2025-05-21T22:55:00+07:00'),
    }));
    await User.bulkCreate(otherUsersData);
    console.log('✅ Created 10 additional users for comments and ratings');

    const professionalUsers = await User.findAll({ where: { email: ['user1504@gmail.com', 'user1110@gmail.com'] } });
    const otherUsers = await User.findAll({ where: { email: { [Op.notIn]: ['user1504@gmail.com', 'user1110@gmail.com'] } } });

    // Seed Posts
    const listingType = await ListingType.findOne() || await ListingType.create({ id: uuidv4(), name: 'Bán' });
    const tag = await Tag.findOne({ where: { tagName: 'Nhà đất bán' } }) || await Tag.create({ id: uuidv4(), tagName: 'Nhà đất bán' });

    const postsData: any[] = [];
    for (const user of professionalUsers) {
      for (let i = 0; i < 25; i++) {
        const { address, city, district, ward, street } = generateAddress();
        const propertyType = faker.helpers.arrayElement(['Căn hộ chung cư', 'Nhà phố', 'Biệt thự', 'Đất nền']);
        const listingTypeName = 'Bán';
        const priceRange = getPriceRange(propertyType, city);
        const price = faker.number.int(priceRange);
        const squareMeters = faker.number.int({ min: propertyType === 'Đất nền' ? 100 : 50, max: 300 });
        const bedroom = propertyType === 'Đất nền' ? null : faker.number.int({ min: 1, max: 5 });
        const bathroom = propertyType === 'Đất nền' ? null : faker.number.int({ min: 1, max: 4 });
        const direction = faker.helpers.arrayElement(['Bắc', 'Nam', 'Đông', 'Tây', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam']);

        postsData.push({
          id: uuidv4(),
          userId: user.id,
          title: `${listingTypeName} ${propertyType} tại ${street}, ${district}, ${city}`,
          priceUnit: PriceUnit.VND,
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
          verified: i < 23, // 23/25 posts verified (92% approval rate)
          isRejected: i >= 23,
          status: faker.helpers.arrayElement(['Còn trống', 'Đang đàm phán', 'Đã bàn giao']),
          slug: `${listingTypeName.toLowerCase()}-${street.substring(0, 10)}-${district.substring(0, 10)}-${user.id.substring(0, 8)}-${i}`,
          expiredDate: addDays(new Date('2025-05-21T22:55:00+07:00'), faker.number.int({ min: 1, max: 30 })),
          createdAt: new Date('2025-05-21T22:55:00+07:00'),
          updatedAt: new Date('2025-05-21T22:55:00+07:00'),
        });
      }
    }

    await Post.bulkCreate(postsData, { validate: true });
    console.log('✅ Created 50 posts for professional users (25 each)');

    // Seed PropertyTypes, TagPosts, Images
    const propertyTypes: any[] = [];
    const tagPosts: any[] = [];
    const images: any[] = [];
    const posts = await Post.findAll({ where: { userId: professionalUsers.map(u => u.id) } });

    for (const post of posts) {
      const propertyTypeName = post.title.includes('Căn hộ') ? 'Căn hộ chung cư' : post.title.includes('Nhà phố') ? 'Nhà phố' : post.title.includes('Biệt thự') ? 'Biệt thự' : 'Đất nền';
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
        images.push({
          id: uuidv4(),
          postId: post.id,
          postDraftId: null,
          imageUrl: faker.helpers.arrayElement(propertyLinks),
        });
      }
    }

    await PropertyType.bulkCreate(propertyTypes, { validate: true });
    await TagPost.bulkCreate(tagPosts, { validate: true });
    await Image.bulkCreate(images, { validate: true });
    console.log('✅ Created property types, tag posts, and images');

    // Seed Transactions
    const transactionsData: any[] = [];
    for (const user of professionalUsers) {
      transactionsData.push({
        id: uuidv4(),
        userId: user.id,
        amount: 1500000, // Ensures ≥ 1,000,000 VNĐ
        description: 'Nạp tiền để đăng ký môi giới chuyên nghiệp',
        orderCode: faker.number.int({ min: 100000, max: 999999 }),
        status: Status.COMPLETED,
        createdAt: new Date('2025-05-21T22:55:00+07:00'),
        updatedAt: new Date('2025-05-21T22:55:00+07:00'),
      });
      // Balance already set in user data
      await user.save();
    }
    await Transaction.bulkCreate(transactionsData);
    console.log('✅ Created successful transactions for professional users');

    // Seed Ratings
    const ratingsData: any[] = [];
    for (const user of professionalUsers) {
      const userPosts = await Post.findAll({ where: { userId: user.id } });
      for (const post of userPosts) {
        for (let i = 0; i < 3; i++) { // 3 ratings per post (75 total) for avg ≥ 4.0
          ratingsData.push({
            id: uuidv4(),
            userId: faker.helpers.arrayElement(otherUsers).id,
            postId: post.id,
            rating: faker.helpers.arrayElement([4, 5]),
            createdAt: new Date('2025-05-21T22:55:00+07:00'),
            updatedAt: new Date('2025-05-21T22:55:00+07:00'),
          });
        }
      }
    }
    await Rating.bulkCreate(ratingsData, { validate: true });
    console.log('✅ Created ratings for professional users’ posts');

    // Seed Comments
    const commentsData: any[] = [];
    for (const user of professionalUsers) {
      const userPosts = await Post.findAll({ where: { userId: user.id } });
      for (const post of userPosts.slice(0, 2)) { // 2 posts, 5 comments each
        for (let i = 0; i < 5; i++) {
          commentsData.push({
            id: uuidv4(),
            userId: faker.helpers.arrayElement(otherUsers).id,
            postId: post.id,
            content: faker.lorem.sentences(2),
            status: CommentStatus.ACTIVE,
            parentId: null,
            level: 1,
            createdAt: new Date('2025-05-21T22:55:00+07:00'),
            updatedAt: new Date('2025-05-21T22:55:00+07:00'),
          });
        }
      }
    }
    await Comment.bulkCreate(commentsData);
    console.log('✅ Created comments for professional users’ posts');


    // Seed UserPricings
    const userPricingsData: any[] = [];
    const vipPricing = await Pricing.findOne({ where: { name: 'VIP_1' } });
    if (vipPricing) {
      for (const user of professionalUsers) {
        userPricingsData.push({
          id: uuidv4(),
          userId: user.id,
          pricingId: vipPricing.id,
          remainingPosts: 30,
          displayDay: 30,
          startDate: new Date('2025-05-21T22:55:00+07:00'),
          boostDays: 7,
          endDate: addDays(new Date('2025-05-21T22:55:00+07:00'), 30), // June 20, 2025
          status: Status.COMPLETED,
          createdAt: new Date('2025-05-21T22:55:00+07:00'),
          updatedAt: new Date('2025-05-21T22:55:00+07:00'),
        });
        userPricingsData.push({
          id: uuidv4(),
          userId: user.id,
          pricingId: vipPricing.id,
          remainingPosts: 0,
          displayDay: 30,
          startDate: new Date('2025-03-21T22:55:00+07:00'),
          boostDays: 7,
          endDate: new Date('2025-04-20T22:55:00+07:00'),
          status: Status.COMPLETED,
          createdAt: new Date('2025-03-21T22:55:00+07:00'),
          updatedAt: new Date('2025-03-21T22:55:00+07:00'),
        });
      }
    }
    await UserPricing.bulkCreate(userPricingsData);
    console.log('✅ Created user pricings for professional users');

    // Verify conditions
    console.log('🔍 Verifying conditions for professional users:');
    for (const user of professionalUsers) {
      const posts = await Post.count({ where: { userId: user.id } });
      const approvedPosts = await Post.count({ where: { userId: user.id, verified: true, isRejected: false } });
      const comments = await Comment.count({
        where: { postId: { [Op.in]: (await Post.findAll({ where: { userId: user.id } })).map(p => p.id) }, userId: { [Op.ne]: user.id } },
      });
      const ratings = await Rating.findAll({ where: { postId: { [Op.in]: (await Post.findAll({ where: { userId: user.id } })).map(p => p.id) } } });
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
      const transactions = await Transaction.sum('amount', { where: { userId: user.id, status: Status.COMPLETED } });
      const userPricings = await UserPricing.count({ where: { userId: user.id } });
      const activeVip = await UserPricing.count({
        where: { userId: user.id, status: Status.COMPLETED, endDate: { [Op.gte]: new Date('2025-04-21T22:55:00+07:00') } },
      });

      console.log(`User ${user.email}:`);
      console.log(`- Posts: ${posts} (Approved: ${approvedPosts}, Rate: ${(approvedPosts / posts * 100).toFixed(2)}%)`);
      console.log(`- Comments from others: ${comments}`);
      console.log(`- Average rating: ${avgRating.toFixed(2)}`);
      console.log(`- Total deposited: ${transactions || 0} VNĐ`);
      console.log(`- User pricings: ${userPricings}, Active VIP: ${activeVip}`);
      console.log(`- Profile: SelfIntro=${!!user.selfIntroduction}, CustomAvatar=${user.avatar !== 'https://img.freepik.com/premium-vector/user-icons-includes-user-icons-people-icons-symbols-premiumquality-graphic-design-elements_981536-526.jpg'}, ExperienceYears=${!!user.experienceYears}`);
      console.log(`- Account: Phone=${!!user.phone}, EmailVerified=${user.emailVerified}, NotLocked=${!user.isLock && !user.isPermanentlyLocked}, Active1Year=${user.createdAt <= new Date('2024-05-21T22:55:00+07:00')}`);
    }

    console.log('🎉 Completed seeding 2 professional users (user1504, user1110) with all conditions met!');
  } catch (error) {
    console.error('Lỗi khi chạy seedProfessionalUsers:', error);
    throw error;
  }
};