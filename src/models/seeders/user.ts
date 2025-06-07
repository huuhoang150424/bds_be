import { v4 as uuidv4 } from "uuid";
import { Faker, vi as viLocale } from "@faker-js/faker";
import User from "@models/user.model";
import { Roles, Gender } from "@models/enums";
import { cities } from "@config/constant/adress";

const faker = new Faker({ locale: viLocale });

export const seedUsers = async () => {
  try {
    const password = "123456";

    const avatars = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmS6YQROniNylqAg3QWhl5S2A2DLP9USXCRA&s",
      "https://i.pinimg.com/564x/24/21/85/242185eaef43192fc3f9646932fe3b46.jpg",
      "https://uuc.edu.vn/uploads/blog/2025/01/16/92291b68d1c3a5391111046b5059de42139dec9e-1736979877.webp",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDGGxnaZ5oCLmiT_iIWNAEuPiA5uhN4fgE4Q&s",
      "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/483329swL/anh-mo-ta.png",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZbMPqYroYd4Hmfi_qj2Sxb4v7YBZeL6U07w&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIgjZTSL_kLHGL4_iIWNAEuPiA5uhN4fgE4Q&s",
    ];

    const genders = Object.values(Gender);

    const generateAddress = () => {
      const cityData = faker.helpers.weightedArrayElement(
        cities.map(city => ({
          value: city,
          weight: city.weight,
        }))
      );

      const district: string = faker.helpers.arrayElement(cityData.districts);
      const street: string = faker.helpers.arrayElement(cityData.streets);
      const wardList = (cityData.wards as any)[district];
      const ward = Array.isArray(wardList)
        ? faker.helpers.arrayElement(wardList)
        : "Phường/Xã bất kỳ";
      const houseNumber: number = faker.number.int({ min: 1, max: 999 });

      return `Số ${houseNumber} ${street}, ${ward}, ${district}, ${cityData.name}`;
    };

    const generateEmail = (fullname: string, index: number) => {
      const nameParts = fullname
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(" ");
      const firstName = nameParts[nameParts.length - 1];
      const lastNameInitial = nameParts[0][0];
      return `${firstName}${lastNameInitial}${index}@gmail.com`;
    };

    // Tạo tài khoản admin
    await User.findOrCreate({
      where: { email: "admin@gmail.com" },
      defaults: {
        id: uuidv4(),
        fullname: "Quản Trị Viên",
        password,
        emailVerified: true,
        address: generateAddress(),
        roles: Roles.Admin,
        gender: Gender.Male,
        phone: "0900000000",
        dateOfBirth: new Date("1985-05-15"),
        avatar: avatars[0],
        isProfessional: false,
        balance: 0,
        score: 100,
      },
    });

    const total = 4000;
    const professionalCount = 2000;
    const batchSize = 500;
    let currentIndex = 1;

    const bioTemplates = [
      `Chuyên gia bất động sản tại ${faker.location.city()}, có kinh nghiệm trong lĩnh vực mua bán ${faker.helpers.arrayElement([
        "căn hộ chung cư",
        "nhà phố",
        "biệt thự",
        "đất nền",
      ])}.`,
      `Nhà môi giới bất động sản với ${faker.number.int({ min: 1, max: 10 })} năm kinh nghiệm tại ${faker.location.city()}.`,
      `Chuyên cung cấp giải pháp bất động sản tại ${faker.location.city()}, tập trung vào ${faker.helpers.arrayElement([
        "đầu tư",
        "cho thuê",
        "mua bán",
      ])}.`,
      `Đam mê tìm kiếm cơ hội bất động sản tốt nhất cho khách hàng tại ${faker.location.city()}.`,
      `Chuyên viên tư vấn bất động sản, chuyên về ${faker.helpers.arrayElement(["căn hộ cao cấp", "nhà phố thương mại", "đất nền dự án"])}.`,
    ];

    const expertiseTemplates = [
      "căn hộ chung cư",
      "nhà phố",
      "biệt thự",
      "đất nền",
      "đầu tư bất động sản",
      "cho thuê nhà",
      "nhà phố thương mại",
      "shophouse",
      "văn phòng",
      "kho xưởng",
    ];

    const generateUser = (index: number, isProfessional: boolean) => {
      const fullname = faker.person.fullName();
      return {
        id: uuidv4(),
        fullname,
        email: generateEmail(fullname, index),
        password,
        emailVerified: true,
        address: generateAddress(),
        gender: faker.helpers.arrayElement(genders),
        phone: `09${faker.string.numeric(8)}`,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        roles: isProfessional ? Roles.Agent : Roles.User,
        avatar: faker.helpers.arrayElement(avatars),
        isProfessional,
        balance: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
        score: faker.number.int({ min: 0, max: 100 }),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(isProfessional && {
          selfIntroduction: faker.helpers.arrayElement(bioTemplates),
          experienceYears: faker.number.int({ min: 1, max: 10 }).toString(),
          certificates: faker.lorem.words(3),
          expertise: [
            faker.helpers.arrayElement(expertiseTemplates),
            faker.helpers.arrayElement(expertiseTemplates.filter(item => item !== expertiseTemplates[0])), // Đảm bảo không trùng
          ],
        }),
      };
    };

    const createBatch = async (usersArray: any[]) => {
      await User.bulkCreate(usersArray, { validate: true });
      console.log(`✅ Đã tạo ${usersArray.length} người dùng`);
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

    console.log("🎉 Hoàn tất tạo người dùng!");
  } catch (error) {
    console.error("Lỗi khi chạy seedUsers:", error);
    throw error;
  }
};