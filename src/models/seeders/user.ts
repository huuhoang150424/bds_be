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
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmS6YQROniNylqAg3QWhl5S2A2DLP9USXCRA&s",
    "https://i.pinimg.com/564x/24/21/85/242185eaef43192fc3f9646932fe3b46.jpg",
    "https://uuc.edu.vn/uploads/blog/2025/01/16/92291b68d1c3a5391111046b5059de42139dec9e-1736979877.webp",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDGGxnaZ5oCLmiT6Fps0LL15z2R1tPcSivg&s",
    "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/483329swL/anh-mo-ta.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZbMPqYroYd4Hmfi_qj2Sxb4v7YBZeL6U07w&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIgjZTSL_kLHGL4_iIWNAEuPiA5uhN4fgE4Q&s"
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
