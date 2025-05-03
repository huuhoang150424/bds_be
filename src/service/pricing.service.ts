import { UserService, NotificationService } from '@service';
import { Pricing, User, UserPricing } from '@models';
import { NotFoundError, BadRequestError } from '@helper';
import { sequelize } from '@config/database';
import { Op } from 'sequelize';
import moment from 'moment';
import { Status } from '@models/enums';
class PricingService {
  static async buyPricing(userId: string, pricingId: string) {
    const transaction = await sequelize.transaction();
    try {
      const existingUserPricing = await UserPricing.findOne({
        where: {
          userId,
          endDate: { [Op.gt]: new Date() },
        },
        order: [['endDate', 'DESC']],
      });

      if (existingUserPricing) {
        console.log("lỗi 1")
        throw new BadRequestError('Bạn đã có một gói VIP đang hoạt động!');
      }
      const [user, pricing] = await Promise.all([UserService.getUserById(userId), Pricing.findByPk(pricingId)]);
      if (!pricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      if (!pricing.isActive) {
        console.log("lỗi 2")
        throw new BadRequestError('Gói vip đã dừng hoạt động');
      }
      if (user.balance < pricing.price) {
        throw new BadRequestError('Số dư không đủ để mua gói này!');
      }
      await user.update({ balance: user.balance - pricing.price }, { transaction });
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      await UserPricing.create(
        {
          userId,
          pricingId,
          remainingPosts: pricing.maxPost,
          displayDay: pricing.displayDay,
          startDate,
          endDate,
          status:Status.COMPLETED,
          boostDays: pricing.boostDays,
        },
        { transaction },
      );
      await transaction.commit();
      await NotificationService.createNotification(userId, `Bạn đã mua gói ${pricing.name} thành công!`);
      return { message: 'Mua gói thành công!', pricing };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updatePricing(userId: string, newPricingId: string) {
    const transaction = await sequelize.transaction();
    try {
      const [user, newPricing] = await Promise.all([UserService.getUserById(userId), Pricing.findByPk(newPricingId)]);
      if (!newPricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      const userPricing = await UserPricing.findOne({
        where: { userId },
        order: [['endDate', 'DESC']],
        transaction,
      });
      if (!userPricing) {
        if (user.balance < newPricing.price) {
          throw new BadRequestError('Số dư không đủ để mua gói này!');
        }
        await user.update({ balance: user.balance - newPricing.price }, { transaction });
        await UserPricing.create(
          {
            userId,
            pricingId: newPricing.id,
            remainingPosts: newPricing.maxPost ?? null,
            displayDay: newPricing.displayDay ?? 10,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            boostDays: newPricing.boostDays ?? 0,
            hasReport: false,
          },
          { transaction },
        );
      } else {
        const currentPricing = await Pricing.findByPk(userPricing.pricingId, {
          transaction,
        });
        if (!currentPricing) {
          throw new NotFoundError('Gói hiện tại không hợp lệ!');
        }
        if (currentPricing.price >= newPricing.price) {
          throw new BadRequestError('Bạn đã có gói VIP cao hơn hoặc bằng gói mới!');
        }
        const priceDifference = newPricing.price - currentPricing.price;
        if (user.balance < priceDifference) {
          throw new BadRequestError(`Số dư không đủ, bạn cần thêm ${priceDifference} VND!`);
        }
        await user.update({ balance: user.balance - priceDifference }, { transaction });
        await userPricing.update(
          {
            pricingId: newPricing.id,
            remainingPosts: newPricing.maxPost ?? userPricing.remainingPosts,
            displayDay: newPricing.displayDay ?? userPricing.displayDay,
            boostDays: newPricing.boostDays ?? userPricing.boostDays,
          },
          { transaction },
        );
      }
      await transaction.commit();
      await NotificationService.createNotification(userId, `Nâng cấp gói ${newPricing.name} thành công!`);
      return { newPricing };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAllPricing(page: number, limit: number, offset: number) {
    const { rows, count } = await Pricing.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async createPricing(pricingData: Partial<Pricing>) {
    const pricing = await Pricing.create(pricingData);
    return pricing;
  }

  static async editPricing(id: string, pricingData: Partial<Pricing>) {
    const pricing = await Pricing.findByPk(id);
    if (!pricing) {
      throw new NotFoundError('Gói thành viên không tồn tại!');
    }
    await pricing.update(pricingData);
    return pricing;
  }

  static async deletePricing(id: string) {
    const pricing = await Pricing.findByPk(id);
    if (!pricing) {
      throw new NotFoundError('Gói thành viên không tồn tại!');
    }
    const userPricings = await UserPricing.findOne({
      where: { pricingId: id },
    });
    if (userPricings) {
      throw new BadRequestError('Không thể xóa gói vì đã có người dùng sử dụng (đang hoặc đã sử dụng)!');
    }
    await pricing.destroy();
    return { message: 'Xóa gói thành công!' };
  }


  static async stopPricing(id: string) {
    const transaction = await sequelize.transaction();
    try {
      const pricing = await Pricing.findByPk(id, { transaction });
      if (!pricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      if (!pricing.isActive) {
        throw new BadRequestError('Gói đã được dừng trước đó!');
      }
      const activeUserPricings = await UserPricing.findAll({
        where: {
          pricingId: id,
          endDate: { [Op.gt]: new Date() },
        },
        include: [{ model: User }, { model: Pricing }],
        transaction,
      });
      for (const userPricing of activeUserPricings) {
        const user = userPricing.user;
        const pricing = userPricing.pricing;
        const totalDays = moment(userPricing.endDate).diff(moment(userPricing.startDate), 'days');
        const remainingDays = moment(userPricing.endDate).diff(moment(), 'days');
        if (remainingDays < 0) continue;
        const refundAmount = (remainingDays / totalDays) * pricing.price;
        await User.update(
          { balance: user.balance + refundAmount },
          { where: { id: user.id }, transaction }
        );
        await userPricing.update({ endDate: new Date() }, { transaction });
      }
      await pricing.update({ isActive: false }, { transaction });
      await transaction.commit();
      return { message: 'Dừng gói thành công và hoàn tiền cho người dùng!' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
}

export default PricingService;
