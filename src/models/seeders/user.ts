import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import { Roles, Gender } from "@models/enums";

export const seedUsers = async () => {
  const password = "123456";

  const addresses = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Huế",
    "Bình Dương",
    "Quảng Ninh",
    "Nghệ An",
    "Khánh Hòa"
  ];

  const genders = Object.values(Gender);

  const users = [
    {
      fullname: "Admin User",
      email: "admin@gmail.com",
      roles: Roles.Admin,
      emailVerified: false,
      address: "Hà Nội",
      gender: Gender.Male,
      dateOfBirth: new Date("1985-05-15"),
    },
    {
      fullname: "User 21",
      email: "user21@gmail.com",
      roles: Roles.Agent,
      emailVerified: false,
      address: "TP. Hồ Chí Minh",
      gender: Gender.Female,
      dateOfBirth: new Date("1990-08-21"),
    },
    ...Array.from({ length: 100 }, (_, i) => ({
      fullname: `User ${i + 1}`,
      email: `user${i + 1}@gmail.com`,
      roles: Roles.User,
      emailVerified: false,
      address: addresses[Math.floor(Math.random() * addresses.length)], 
      gender: genders[Math.floor(Math.random() * genders.length)], 
      dateOfBirth: new Date(`19${Math.floor(Math.random() * 30) + 70}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`), // Random ngày sinh
    })),
  ];

  await Promise.all(
    users.map(async (user) => {
      await User.findOrCreate({
        where: { email: user.email },
        defaults: {
          id: uuidv4(),
          password: password,
          ...user,
        },
      });
    })
  );
};
