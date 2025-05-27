import User from "@models/user.model";
import { Status, PaymentMethod } from "@models/enums";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import Transaction from "@models/transactions.model";

export const seedTransactions = async () => {
  const users = await User.findAll({ attributes: ["id", "balance"] });
  const transactionsPerUser = 3;
  const batchSize = 5000;

  let totalInserted = 0;

  for (const user of users) {
    user.balance = 0; 
  
    const batch: any[] = [];
  
    for (let i = 0; i < transactionsPerUser; i++) {
      const isIncome = faker.datatype.boolean();
      const amount = faker.number.int({ min: 1_000_000, max: 100_000_000 });
  
      if (isIncome) {
        user.balance += amount;
      } else {
        user.balance -= amount;
        if (user.balance < 0) user.balance = 0;
      }
  
      batch.push({
        id: uuidv4(),
        userId: user.id,
        amount,
        description: faker.lorem.sentence(),
        orderCode: faker.number.int({ min: 100000, max: 999999 }),
        paymentMethod: faker.helpers.arrayElement(Object.values(PaymentMethod)),
        status: faker.helpers.arrayElement(Object.values(Status)),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  
    for (let i = 0; i < batch.length; i += batchSize) {
      const chunk = batch.slice(i, i + batchSize);
      await Transaction.bulkCreate(chunk);
      totalInserted += chunk.length;
      console.log(`✅ Đã thêm ${totalInserted} giao dịch`);
    }
  
    console.log(`💰 Balance cuối cùng của user ${user.id}: ${user.balance}`);
    await user.save();
  }
  

  console.log("🎉 Seeder giao dịch hoàn tất.");
};
