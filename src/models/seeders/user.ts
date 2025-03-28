import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import { Roles } from "@models/enums";

export const seedUsers = async () => {
  const password = "123456"
  const users = [
    {
      fullname: "Admin User",
      email: "admin@gmail.com",
      roles: Roles.Admin,
      phone: "0123456789",
      emailVerified: true,
    },
    {
      fullname: "User 21",
      email: "user21@gmail.com",
      roles: Roles.Agent,
      phone: "0123456734",
      emailVerified: false,
    },
    ...Array.from({ length: 100 }, (_, i) => ({
      fullname: `User ${i + 1}`,
      email: `user${i + 1}@gmail.com`,
      roles: Roles.User,
      phone: `012345678${i}`,
      emailVerified: false,
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
