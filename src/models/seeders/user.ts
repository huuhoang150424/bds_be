import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import { Roles } from "@models/enums";

export const seedUsers = async () => {
  const password = "123456";

  // Danh sách địa chỉ giả
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

  const users = [
    {
      fullname: "Admin User",
      email: "admin@gmail.com",
      roles: Roles.Admin,
      emailVerified: false,
      address: "Hà Nội",
    },
    {
      fullname: "User 21",
      email: "user21@gmail.com",
      roles: Roles.Agent,
      emailVerified: false,
      address: "TP. Hồ Chí Minh",
    },
    ...Array.from({ length: 100 }, (_, i) => ({
      fullname: `User ${i + 1}`,
      email: `user${i + 1}@gmail.com`,
      roles: Roles.User,
      emailVerified: false,
      address: addresses[Math.floor(Math.random() * addresses.length)], // Random địa chỉ
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
