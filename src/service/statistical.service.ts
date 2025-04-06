import { ActionType, Roles } from "@models/enums";
import { UserView, Post, User } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, Transaction, Sequelize } from "sequelize";

class StatisticalService {
  static async getViewByAddress(userId: string) {
    if (!userId) {
      throw new BadRequestError('UserId không được để trống');
    }

    // Bản đồ ánh xạ địa chỉ theo miền
    const regionMap: { [key: string]: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' } = {
      'Hà Nội': 'Miền Bắc',
      'Hải Phòng': 'Miền Bắc',
      'Quảng Ninh': 'Miền Bắc',
      'Nghệ An': 'Miền Bắc',

      'Đà Nẵng': 'Miền Trung',
      'Huế': 'Miền Trung',
      'Khánh Hòa': 'Miền Trung',

      'TP. Hồ Chí Minh': 'Miền Nam',
      'Cần Thơ': 'Miền Nam',
      'Bình Dương': 'Miền Nam',
    };

    const result = await UserView.findAll({
      attributes: [
        [Sequelize.col('post.user.address'), 'address'],
        [Sequelize.fn('COUNT', Sequelize.col('UserView.id')), 'viewCount'],
      ],
      include: [
        {
          model: Post,
          attributes: [],
          where: { userId },
          include: [
            {
              model: User,
              attributes: [],
              required: true,
            },
          ],
        },
      ],
      group: ['post.user.address'],
      raw: true,
    });

    // Gộp view theo miền
    const regionViewMap: { [key: string]: number } = {
      'Miền Bắc': 0,
      'Miền Trung': 0,
      'Miền Nam': 0,
      'Khác': 0,
    };

    result.forEach((item: any) => {
      const address = item.address || 'Khác';
      const region = regionMap[address] || 'Khác';
      regionViewMap[region] += parseInt(item.viewCount);
    });

    const total = Object.values(regionViewMap).reduce((sum, count) => sum + count, 0);

    const data = Object.entries(regionViewMap).map(([region, viewCount]) => ({
      region,
      viewCount,
      percentage: total > 0 ? Math.round((viewCount / total) * 100) : 0,
    }));

    return data;
  }

}

export default StatisticalService;