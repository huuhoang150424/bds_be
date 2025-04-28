import { Transaction, User } from '@models';
import { BadRequestError, NotFoundError } from '@helper';
import { payOS } from '@config/payos';
import { sequelize } from '@config/database';
import NotificationService from '@service/notification.service';
import { Status } from '@models/enums';

class TransactionService {
  static async createTransaction(userId: string, amount: number, description: string) {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }
    const transaction = await Transaction.create({
      userId,
      amount,
      description,
      status: Status.PENDING,
      paymentMethod: 'bank_transfer',
    });
    console.log(transaction);
    const orderCode = Number(String(new Date().getTime()).slice(-6));
    transaction.orderCode = orderCode;
    await transaction.save();
    const body = {
      orderCode: orderCode,
      amount,
      description,
      returnUrl: `${process.env.BASE_URL}/transaction/success`,
      cancelUrl: `${process.env.BASE_URL}/transaction/cancel`,
    };
    const response = await payOS.createPaymentLink(body);
    console.log(response);
    return { transaction, checkoutUrl: response.checkoutUrl };
  }

  static async completeTransaction(orderCode: number) {
    const t = await sequelize.transaction();
    try {
      const transaction = await Transaction.findOne({
        where: { orderCode },
        include: [User],
        transaction: t,
      });
      console.log(transaction);
      if (!transaction) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      if (transaction.status === 'completed') {
        throw new Error('Giao dịch đã hoàn thành trước đó');
      }
      transaction.status = 'completed';
      await transaction.save({ transaction: t });
      const user = transaction.user;
      if (user) {
        user.balance += transaction.amount;
        await user.save({ transaction: t });
      }
      await t.commit();
      await NotificationService.createNotification(user.fullname, `Bạn đã nạp ${transaction.amount} thành công `);
      return transaction;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async updateTransactionStatus(orderCode: number, type: 'failed' | 'cancelled') {
    const transaction = await Transaction.findOne({
      where: { orderCode },
    });
    if (!transaction) {
      throw new NotFoundError('Giao dịch không tồn tại');
    }
    if (transaction.status === type) {
      throw new BadRequestError(`Giao dịch đã ở trạng thái ${type}`);
    }

    transaction.status = type;
    await transaction.save();
    return transaction;
  }
}

export default TransactionService;
