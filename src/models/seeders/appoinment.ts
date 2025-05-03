import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import User from "@models/user.model";
import Post from "@models/post.model";
import { AppointmentStatus } from "@models/enums";
import Appointment from "@models/appointments.model";

export const seedAppointments = async () => {
  const users = await User.findAll();
  const posts = await Post.findAll();

  if (users.length < 2 || posts.length === 0) return;

  const statuses = Object.values(AppointmentStatus);
  const appointments: Partial<Appointment>[] = [];

  for (const requester of users) {
    for (let i = 0; i < 100; i++) {
      let receiver = faker.helpers.arrayElement(users);
      // Đảm bảo requester và receiver khác nhau
      while (receiver.id === requester.id) {
        receiver = faker.helpers.arrayElement(users);
      }

      const post = faker.helpers.arrayElement(posts);

      appointments.push({
        id: uuidv4(),
        requesterId: requester.id,
        receiverId: receiver.id,
        postId: post.id,
        appointmentTime: faker.date.soon({ days: 30 }),
        duration: faker.number.int({ min: 15, max: 60 }),
        status: faker.helpers.arrayElement(statuses),
        message: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await Appointment.bulkCreate(appointments);
};
