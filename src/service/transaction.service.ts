import { Pricing, Transaction, User, UserPricing } from '@models';
import { BadRequestError, NotFoundError } from '@helper';
import { payOS } from '@config/payos';
import { sequelize } from '@config/database';
import NotificationService from '@service/notification.service';
import { Status } from '@models/enums';
import { Op } from 'sequelize';

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
    const orderCode = Number(String(new Date().getTime()).slice(-6));
    transaction.orderCode = orderCode;
    await transaction.save();
    const body = {
      orderCode: orderCode,
      amount,
      description,
      returnUrl: `${process.env.FRONTEND_URL}`,
      cancelUrl: `${process.env.FRONTEND_URL}`,
    };
    const response = await payOS.createPaymentLink(body);
    return { transaction, checkoutUrl: response.checkoutUrl };
  }

  static async completeTransaction(orderCode: number) {
    const t = await sequelize.transaction();
    try {
      const transaction = await Transaction.findOne({
        where: { orderCode },
        include: [User],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!transaction) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      if (transaction.status === Status.COMPLETED) {
        await t.commit();
        return transaction;
      }
      transaction.status = Status.COMPLETED;
      await transaction.save({ transaction: t });
      const user = transaction.user;
      if (user) {
        user.balance += transaction.amount;
        await user.save({ transaction: t });
      }
      await t.commit();
      await NotificationService.createNotification(user.id, `Bạn đã nạp ${transaction.amount} thành công `);
      return transaction;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async updateTransactionStatus(orderCode: number, type: Status.FAILED | Status.CANCELLED) {
    const t = await sequelize.transaction();
    try {
      console.log(`Finding transaction for orderCode: ${orderCode}`);
      const transaction = await Transaction.findOne({
        where: { orderCode },
        include: [User],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!transaction) {
        console.log(`Transaction not found for orderCode: ${orderCode}`);
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      console.log(`Current transaction status for orderCode: ${orderCode}: ${transaction.status}`);
      if (transaction.status === type) {
        console.log(`Transaction ${orderCode} already in status: ${type}`);
        await t.commit();
        return transaction;
      }
      console.log(`Updating transaction ${orderCode} to status: ${type}`);
      transaction.status = type;
      await transaction.save({ transaction: t });
      await t.commit();
      console.log(`Committed transaction status update for orderCode: ${orderCode}`);
      console.log(`Transaction updated:`, transaction.toJSON());
      return transaction;
    } catch (error) {
      console.error(`Error in updateTransactionStatus for orderCode: ${orderCode}`, error);
      await t.rollback();
      throw error;
    }
  }

  static async getAllTransactions(userId: string, page: number, limit: number, type: string) {
    const offset = (page - 1) * limit;
  
    if (type === 'income') {
      const { count, rows } = await Transaction.findAndCountAll({
        where: { userId },
        offset,
        limit,
        order: [['createdAt', 'DESC']],
      });
  
      return {
        currentPage: page,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        data: rows,
      };
    } else if (type === 'expense') {
      const { count, rows } = await UserPricing.findAndCountAll({
        where: { userId },
        offset,
        limit,
        order: [['createdAt', 'DESC']],
      });
  
      return {
        currentPage: page,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        data: rows,
      };
    }
  }


  static async getFinancialSummary(userId: string) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Tổng tiền nạp tháng này (Transaction, status: completed)
    const depositsThisMonth = (await Transaction.sum('amount', {
      where: {
        userId,
        status: Status.COMPLETED,
        createdAt: {
          [Op.between]: [startOfThisMonth, endOfThisMonth],
        },
      },
    })) || 0;

    // Tổng chi tiêu cho gói VIP (UserPricing, status: completed, tất cả thời gian)
    const vipPurchases = await UserPricing.findAll({
      where: {
        userId,
        status: Status.COMPLETED,
      },
      include: [
        {
          model: Pricing,
          as: 'pricing',
          attributes: ['price'],
        },
      ],
    });

    const totalVipSpent = vipPurchases.reduce((sum, userPricing) => {
      return sum + (userPricing.pricing?.price || 0);
    }, 0);

    // Tổng chi tháng này (UserPricing, status: completed)
    const vipPurchasesThisMonth = await UserPricing.findAll({
      where: {
        userId,
        status: Status.COMPLETED,
        createdAt: {
          [Op.between]: [startOfThisMonth, endOfThisMonth],
        },
      },
      include: [
        {
          model: Pricing,
          as: 'pricing',
          attributes: ['price'],
        },
      ],
    });

    const totalSpentThisMonth = vipPurchasesThisMonth.reduce((sum, userPricing) => {
      return sum + (userPricing.pricing?.price || 0);
    }, 0);

    // Tổng chi tháng trước (UserPricing, status: completed)
    const vipPurchasesLastMonth = await UserPricing.findAll({
      where: {
        userId,
        status: Status.COMPLETED,
        createdAt: {
          [Op.between]: [startOfLastMonth, endOfLastMonth],
        },
      },
      include: [
        {
          model: Pricing,
          as: 'pricing',
          attributes: ['price'],
        },
      ],
    });

    const totalSpentLastMonth = vipPurchasesLastMonth.reduce((sum, userPricing) => {
      return sum + (userPricing.pricing?.price || 0);
    }, 0);

    // So sánh chi tiêu (%)
    const spendingChangePercent = totalSpentLastMonth === 0
      ? totalSpentThisMonth > 0
        ? 100
        : 0
      : ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100;

    // Số dư hiện tại
    const user = await User.findByPk(userId, { attributes: ['balance'] });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    return {
      depositsThisMonth,
      totalVipSpent,
      balance: user.balance,
      spendingChangePercent: Number(spendingChangePercent.toFixed(2)),
    };
  }
}

export default TransactionService;
