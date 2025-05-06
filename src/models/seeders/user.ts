import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import { Roles, Gender } from "@models/enums";
import { faker } from "@faker-js/faker";

export const seedUsers = async () => {
  const password = "123456";

  const addresses = [
    "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
    "Huế", "Bình Dương", "Quảng Ninh", "Nghệ An", "Khánh Hòa"
  ];

  const avatars = [
    "https://anhnail.com/wp-content/uploads/2024/10/Hinh-gai-xinh-k8-cute.jpg",
    "https://lh7-rt.googleusercontent.com/docsz/AD_4nXe6g6fUIDLESXqrjVvxPI1BpjGMRmu16pWwI2lafSq4bkfjph9_DSDzxQpVruf5VnftjRKnd3e0bFJTOpLvZnVirb01Bg496jf1tJGhseS5OWEaeyJx4DpeonIHHsH0Jsw-vflitP6EA0X2nN7Vag=s412?key=EaGBO2t3RnOp9uiHUHPIVg",
    "https://uuc.edu.vn/uploads/blog/2025/01/16/92291b68d1c3a5391111046b5059de42139dec9e-1736979877.webp",
    "https://cdn-media.sforum.vn/storage/app/media/ctv_seo3/anh-co-gai-xinh-dep-71.jpg",
    "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/483329swL/anh-mo-ta.png",
    "https://cdn.pixabay.com/photo/2018/10/23/08/18/sexy-girl-3767276_640.jpg",
    "https://anhnail.com/wp-content/uploads/2024/11/Hinh-anh-gai-xinh-2009-ca-tinh.jpg"
  ];

  const genders = Object.values(Gender);

  // Tạo admin trước
  await User.findOrCreate({
    where: { email: "admin@gmail.com" },
    defaults: {
      id: uuidv4(),
      fullname: "Admin User",
      password,
      emailVerified: true,
      address: "Hà Nội",
      roles: Roles.Admin,
      gender: Gender.Male,
      phone: "0900000000",
      dateOfBirth: new Date("1985-05-15"),
      avatar: avatars[0],
    },
  });

  const total = 200;
  const professionalCount = 100;
  const normalCount = 100;
  const batchSize = 50;

  const generateUser = (index: number, isProfessional: boolean) => ({
    id: uuidv4(),
    fullname: `User ${index}`,
    email: `user${index}@gmail.com`,
    password: password,
    emailVerified: true,
    address: faker.helpers.arrayElement(addresses),
    gender: faker.helpers.arrayElement(genders),
    phone: `09${faker.string.numeric(8)}`,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
    roles: Roles.Agent,
    avatar: faker.helpers.arrayElement(avatars),
    isProfessional,
    balance: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
    score: faker.number.int({ min: 0, max: 100 }),
    createdAt: new Date(),
    updatedAt: new Date(),

    ...(isProfessional
      ? {
          selfIntroduction: faker.person.bio(),
          experienceYears: faker.number.int({ min: 1, max: 10 }).toString(),
          certificates: faker.lorem.words(3),
          expertise: [faker.word.noun(), faker.word.noun()],
        }
      : {}),
  });

  let currentIndex = 1;

  const createBatch = async (usersArray: any[]) => {
    await User.bulkCreate(usersArray);
    console.log(`✅ Đã tạo ${usersArray.length} user`);
  };

  for (let i = 0; i < total; i += batchSize) {
    const batch: any[] = [];

    for (let j = 0; j < batchSize && currentIndex <= total; j++) {
      const isProfessional = currentIndex <= professionalCount;
      batch.push(generateUser(currentIndex, isProfessional));
      currentIndex++;
    }

    await createBatch(batch);
  }
};
