import { UserService,NotificationService } from '@service';
import { Pricing ,UserPricing} from '@models';
import { NotFoundError,BadRequestError } from '@helper';
import { sequelize } from '@config/database';
import { Op } from 'sequelize';


class PricingService {
	static async buyPricing(userId: string, pricingId: string) {
    const transaction = await sequelize.transaction();
    try {
      const user = await UserService.getUserById(userId);
      const pricing = await Pricing.findByPk(pricingId);
      if (!pricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      if (user.balance < pricing.price) {
        throw new BadRequestError('Số dư không đủ để mua gói này!');
      }
      user.balance -= pricing.price;
      await user.save({ transaction });
      const startDate = new Date();
      const findUserPricing=await UserPricing.findOne({
        where: {
          userId,
          endDate: { [Op.gt]: new Date() }
        },
        order: [['endDate', 'DESC']],
      });
      if (findUserPricing?.pricing) {
        throw new BadRequestError("Bạn đã có một gói VIP đang hoạt động!");
      }
      await findUserPricing?.destroy();
      await UserPricing.create(
        {
          userId,
          pricingId,
          remainingPosts: pricing.maxPost,
          displayDay: pricing.displayDay,
          startDate,
          endDate:new Date(new Date().setMonth(new Date().getMonth() + 1)),
          boostDays: pricing.boostDays
        },
        { transaction }
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
      const user = await UserService.getUserById(userId);
      const newPricing = await Pricing.findByPk(newPricingId);
      if (!newPricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      let userPricing = await UserPricing.findOne({
        where: { userId },
        order: [['endDate', 'DESC']],
        transaction,
      });
      if (!userPricing) {
        if (user.balance < newPricing.price) {
          throw new BadRequestError('Số dư không đủ để mua gói này!');
        }
        user.balance -= newPricing.price;
        await user.save({ transaction });
        userPricing = await UserPricing.create({
          userId,
          pricingId: newPricing.id,
          remainingPosts: newPricing.maxPost ?? null,
          displayDay: newPricing.displayDay ?? 10,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), 
          boostDays: newPricing.boostDays ?? 0,
          hasReport: false,
        }, { transaction });
      } else {
        const currentPricing = await Pricing.findByPk(userPricing.pricingId, { transaction });
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
        user.balance -= priceDifference;
        await user.save({ transaction });
        userPricing.pricingId = newPricing.id;
        userPricing.remainingPosts = newPricing.maxPost ?? userPricing.remainingPosts;
        userPricing.displayDay = newPricing.displayDay ?? userPricing.displayDay;
        userPricing.boostDays = newPricing.boostDays ?? userPricing.boostDays;
        await userPricing.save({ transaction });
      }
      await transaction.commit();
      await NotificationService.createNotification(
        userId,
        `Nâng cấp gói ${newPricing.name} thành công!`
      );
      return { newPricing };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


}


export default PricingService;