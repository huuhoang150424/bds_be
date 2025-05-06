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
      // Lấy thông tin user và gói mới
      const user = await UserService.getUserById(userId);
      const newPricing = await Pricing.findByPk(pricingId);

      if (!newPricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      if (!newPricing.isActive) {
        throw new BadRequestError('Gói VIP đã dừng hoạt động');
      }

      // Kiểm tra gói hiện tại
      const existingUserPricing = await UserPricing.findOne({
        where: {
          userId,
          endDate: { [Op.gt]: new Date() },
          status: Status.COMPLETED,
        },
        include: [{ model: Pricing, as: 'pricing' }],
        order: [['endDate', 'DESC']],
      });

      let refundAmount = 0;
      if (existingUserPricing) {
        const currentPricing = existingUserPricing.pricing;
        // Kiểm tra xem gói mới có phải là nâng cấp không
        const pricingOrder = ['VIP_1', 'VIP_2', 'VIP_3'];
        const currentIndex = pricingOrder.indexOf(currentPricing.name);
        const newIndex = pricingOrder.indexOf(newPricing.name);
        if (newIndex <= currentIndex) {
          throw new BadRequestError('Bạn chỉ có thể nâng cấp lên gói cao hơn!');
        }

        // Tính số tiền hoàn lại
        const currentDate = new Date();
        const endDate = new Date(existingUserPricing.endDate);
        const totalDays = currentPricing.expiredDay === -1 ? 365 : currentPricing.expiredDay; // Giả định 1 năm cho gói không giới hạn
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
        refundAmount = (remainingDays / totalDays) * currentPricing.price;

        // Hủy gói hiện tại
        await existingUserPricing.update({ status: Status.CANCELLED, endDate: currentDate }, { transaction });
      }

      // Tính giá gói mới sau giảm giá
      const finalPrice = newPricing.discountPercent
        ? newPricing.price * (1 - newPricing.discountPercent / 100)
        : newPricing.price;

      // Kiểm tra số dư
      if (user.balance + refundAmount < finalPrice) {
        throw new BadRequestError('Số dư không đủ để mua gói này!');
      }

      // Cập nhật số dư
      await user.update({ balance: user.balance + refundAmount - finalPrice }, { transaction });

      // Tính startDate và endDate
      const startDate = new Date();
      const endDate = newPricing.expiredDay === -1 ? null : new Date(startDate.getTime() + newPricing.expiredDay * 24 * 60 * 60 * 1000);

      // Tạo UserPricing mới
      await UserPricing.create(
        {
          userId,
          pricingId,
          remainingPosts: newPricing.maxPost === -1 ? 999 : newPricing.maxPost,
          displayDay: newPricing.displayDay,
          startDate,
          endDate,
          status: Status.COMPLETED,
          boostDays: newPricing.boostDays,
        },
        { transaction }
      );

      await transaction.commit();

      // Gửi thông báo
      const message = refundAmount
        ? `Bạn đã nâng cấp từ gói ${existingUserPricing?.pricing.name} lên gói ${newPricing.name} thành công! Số tiền hoàn lại: ${refundAmount.toLocaleString('vi-VN')} VNĐ.`
        : `Bạn đã mua gói ${newPricing.name} thành công!`;
      await NotificationService.createNotification(userId, message);

      return { message: 'Mua gói thành công!', pricing: newPricing, refundAmount };
    } catch (error:any) {
      await transaction.rollback();
      console.error(`Lỗi khi mua gói pricing: ${error.message}`);
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
  
	static async getPurchasedPricings(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await UserPricing.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Pricing,
          attributes: ['id', 'name', 'price', 'displayDay', 'boostDays', 'expiredDay'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    if (count === 0) {
      throw new NotFoundError('Không tìm thấy gói nào đã mua.');
    }
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

}

export default PricingService;
