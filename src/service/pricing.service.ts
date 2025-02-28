import { UserService,NotificationService } from '@service';
import { Pricing ,UserPricing} from '@models';
import { NotFoundError,BadRequestError } from '@helper';
import { sequelize } from '@config/database';

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
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + pricing.expiredDay);


      const userPricing = await UserPricing.findOne({ where: { userId }, transaction });
      if (userPricing) {
        userPricing.pricingId = pricingId;
        userPricing.remainingPosts = pricing.maxPost;
        userPricing.displayDay = pricing.displayDay;
        userPricing.startDate = startDate;
        userPricing.endDate = endDate;
        await userPricing.save({ transaction });
      } else {
        await UserPricing.create(
          {
            userId,
            pricingId,
            remainingPosts: pricing.maxPost,
            displayDay: pricing.displayDay,
            startDate,
            endDate,
          },
          { transaction }
        );
      }

      await transaction.commit();
      await NotificationService.createNotification(userId, `Bạn đã mua gói ${pricing.name} thành công!`);
      return { message: 'Mua gói thành công!', pricing };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}


export default PricingService;