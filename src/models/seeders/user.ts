import User from "@models/user.model";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { Roles } from "@models/enums";

export const seedUsers = async () => {

  await User.findOrCreate({
    where: { email: "admin@gmail.com" },
    defaults: {
      id: uuidv4(),
      fullname: "Admin User",
      email: "admin@gmail.com",
      password: "123456",
      phone: "0123456789",
      emailVerified: true,
      roles: Roles.Admin,
    },
  });
	await User.findOrCreate({
		where: { email: `user21@gmail.com` },
		defaults: {
			id: uuidv4(),
			fullname: `User 21`,
			email: `user21@gmail.com`,
			password: "123456",
			phone: `0123456734`,
			emailVerified: false,
			roles: Roles.Agent,
		},
	});
  for (let i = 1; i <= 20; i++) {
    await User.findOrCreate({
      where: { email: `user${i}@gmail.com` },
      defaults: {
        id: uuidv4(),
        fullname: `User ${i}`,
        email: `user${i}@gmail.com`,
        password: "123456",
        phone: `012345678${i}`,
        emailVerified: false,
        roles: Roles.User,
      },
    });
  }
};
