import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { Roles } from "@models/enums";

export const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash("123456", 10);

  await User.findOrCreate({
    where: { email: "admin@gmail.com" },
    defaults: {
      userId: uuidv4(),
      fullname: "Admin User",
      email: "admin@gmail.com",
      password: hashedPassword,
      phone: "0123456789",
      emailVerified: true,
      roles: Roles.Admin,
    },
  });

  for (let i = 1; i <= 20; i++) {
    await User.findOrCreate({
      where: { email: `user${i}@gmail.com` },
      defaults: {
        userId: uuidv4(),
        fullname: `User ${i}`,
        email: `user${i}@gmail.com`,
        password: hashedPassword,
        phone: `012345678${i}`,
        emailVerified: false,
        roles: Roles.User,
      },
    });
  }
};
