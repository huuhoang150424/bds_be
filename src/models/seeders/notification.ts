import Notification from '@models/notification.model';
import User from '@models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

export const seedNotifications = async () => {
  const admin = await User.findOne({ where: { email: 'admin@gmail.com' } });

  if (!admin) {
    throw new Error("Admin user not found. Please seed users first.");
  }

  const total = 10000;
  const batchSize = 1000;

  for (let i = 0; i < total; i += batchSize) {
    const batch = Array.from({ length: batchSize }).map(() => ({
      id: uuidv4(),
      userId: admin.id,
      message: faker.lorem.sentence(), 
      isRead: faker.datatype.boolean(), 
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
    }));

    await Notification.bulkCreate(batch);
    console.log(`✅ Đã tạo ${i + batch.length}/${total} thông báo`);
  }

};
