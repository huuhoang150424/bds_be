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
      // Log múi giờ
      console.log(`Múi giờ máy chủ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

      // Lấy thông tin user và gói mới
      const user = await UserService.getUserById(userId);
      const newPricing = await Pricing.findByPk(pricingId);

      if (!newPricing) {
        throw new NotFoundError('Gói thành viên không tồn tại!');
      }
      if (!newPricing.isActive) {
        throw new BadRequestError('Gói VIP đã dừng hoạt động');
      }

      console.log(
        `Gói mới: ${newPricing.name}, expiredDay: ${newPricing.expiredDay}, displayDay: ${newPricing.displayDay}`,
      );

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
      let actionMessage = 'mua';
      if (existingUserPricing) {
        const currentPricing = existingUserPricing.pricing;
        // Xóa kiểm tra nâng cấp để cho phép hạ cấp
        const pricingOrder = ['VIP_1', 'VIP_2', 'VIP_3'];
        const currentIndex = pricingOrder.indexOf(currentPricing.name);
        const newIndex = pricingOrder.indexOf(newPricing.name);
        actionMessage = newIndex > currentIndex ? 'nâng cấp' : 'chuyển sang';

        const currentDate = new Date();
        const endDate = new Date(existingUserPricing.endDate);
        const totalDays = 30; // Tất cả gói có hiệu lực 30 ngày
        const remainingDays = Math.max(
          0,
          Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
        refundAmount = (remainingDays / totalDays) * currentPricing.price;

        await existingUserPricing.update({ status: Status.CANCELLED, endDate: currentDate }, { transaction });
      }

      const finalPrice = newPricing.discountPercent
        ? newPricing.price * (1 - newPricing.discountPercent / 100)
        : newPricing.price;

      // Kiểm tra số dư, trả về message thay vì throw lỗi
      if (user.balance + refundAmount < finalPrice) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Số dư không đủ để mua gói này!',
        };
      }

      await user.update({ balance: user.balance + refundAmount - finalPrice }, { transaction });

      // Tính startDate và endDate
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30); // Tất cả gói có hiệu lực 30 ngày
      if (isNaN(endDate.getTime())) {
        throw new Error(`Lỗi tính toán endDate cho gói ${newPricing.name}`);
      }

      console.log(`startDate: ${startDate.toISOString()}, endDate: ${endDate.toISOString()}`);

      const newUserPricing = await UserPricing.create(
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
        { transaction },
      );

      console.log(`UserPricing vừa tạo: ${JSON.stringify(newUserPricing, null, 2)}`);

      await transaction.commit();

      const message = refundAmount
        ? `Bạn đã ${actionMessage} từ gói ${existingUserPricing?.pricing.name} sang gói ${newPricing.name} thành công! Số tiền hoàn lại: ${refundAmount.toLocaleString('vi-VN')} VNĐ.`
        : `Bạn đã mua gói ${newPricing.name} thành công!`;
      await NotificationService.createNotification(userId, message);

      return {
        success: true,
        message,
        pricing: newPricing,
        refundAmount,
      };
    } catch (error: any) {
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
        await User.update({ balance: user.balance + refundAmount }, { where: { id: user.id }, transaction });
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
		return {
			totalItems: count,
			totalPages: Math.ceil(count / limit) || 1,
			currentPage: page,
			data: rows,
		};
	}

	static async cancelPricing(userId: string) {
    const transaction = await sequelize.transaction();
    try {
      // Log múi giờ
      console.log(`Múi giờ máy chủ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

      // Lấy thông tin user
      const user = await UserService.getUserById(userId);
      if (!user) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Người dùng không tồn tại!',
        };
      }

      // Tìm gói hiện tại
      const existingUserPricing = await UserPricing.findOne({
        where: {
          userId,
          endDate: { [Op.gt]: new Date() },
          status: Status.COMPLETED,
        },
        include: [{ model: Pricing, as: 'pricing' }],
        order: [['endDate', 'DESC']],
      });

      if (!existingUserPricing) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Bạn hiện không có gói VIP nào để hủy!',
        };
      }

      const currentPricing = existingUserPricing.pricing;
      const startDate = new Date(existingUserPricing.startDate);
      const currentDate = new Date();
      const daysSincePurchase = Math.ceil(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Kiểm tra thời gian hủy (trong 3 ngày)
      if (daysSincePurchase > 3) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Chỉ có thể hủy gói trong vòng 3 ngày kể từ ngày mua!',
        };
      }

      // Tính số tiền hoàn lại (100% giá gói sau giảm giá)
      const refundAmount = currentPricing.discountPercent
        ? currentPricing.price * (1 - currentPricing.discountPercent / 100)
        : currentPricing.price;

      // Cập nhật số dư người dùng
      await user.update({ balance: user.balance + refundAmount }, { transaction });

      // Hủy gói hiện tại
      await existingUserPricing.update(
        { status: Status.CANCELLED, endDate: currentDate },
        { transaction }
      );

      console.log(`Hủy gói: ${currentPricing.name}, refundAmount: ${refundAmount}`);

      await transaction.commit();

      const message = `Bạn đã hủy gói ${currentPricing.name} thành công! Số tiền hoàn lại: ${refundAmount.toLocaleString('vi-VN')} VNĐ.`;
      await NotificationService.createNotification(userId, message);

      return {
        success: true,
        message,
        refundAmount,
        pricing: currentPricing,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error(`Lỗi khi hủy gói: ${error.message}`);
      throw error;
    }
}
}

export default PricingService;
