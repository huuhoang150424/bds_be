import { ActionType, Roles } from "@models/enums";
import { UserView, Post, User } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, fn, col, literal, Sequelize } from "sequelize";

interface MonthlyPostCount {
  month: string;
  count: string;
}

interface RegionStats {
  address: string;
  viewCount: number;
  growthPercentage?: number;
}

class StatisticalService {
  //[get user  view by address]
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
  //[get Post by Month]
  static async getPostByMonth(userId: string) {
    if (!userId) {
      throw new BadRequestError('UserId không được để trống');
    }

    const currentYear = new Date().getFullYear();

    // Sửa tên cột từ createdAt thành created_at để khớp với database
    const result = await Post.findAll({
      attributes: [
        [fn('MONTH', col('created_at')), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        userId,
        created_at: {  // Sửa từ createdAt thành created_at
          [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          [Op.lt]: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
        },
      },
      group: [fn('MONTH', col('created_at'))],
      order: [[fn('MONTH', col('created_at')), 'ASC']],
      raw: true,
    }) as unknown as MonthlyPostCount[];

    // Tạo array đủ 12 tháng
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const found = result.find((item) => Number(item.month) === index + 1);
      return {
        month: `T${index + 1}`,
        count: found ? parseInt(found.count) : 0,
      };
    });

    return monthlyData;
  }

  static async getTopSearchRegionsWithGrowth(limit: number = 5): Promise<RegionStats[]> {
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);

    const currentMonthViews = await UserView.findAll({
      attributes: [
        [Sequelize.col('post.address'), 'address'],
        [fn('COUNT', Sequelize.literal('*')), 'viewCount'], 
      ],
      include: [
        {
          model: Post,
          attributes: [],
          required: true,
        },
      ],
      where: {
        viewedAt: {
          [Op.gte]: thirtyDaysAgo,
          [Op.lte]: currentDate,
        },
      },
      group: ['post.address'],
      order: [[fn('COUNT', Sequelize.literal('*')), 'DESC']],
      limit: limit,
      raw: true,
    });

    const previousMonthViews = await UserView.findAll({
      attributes: [
        [Sequelize.col('post.address'), 'address'],
        [fn('COUNT', Sequelize.literal('*')), 'viewCount'],
      ],
      include: [
        {
          model: Post,
          attributes: [],
          required: true,
        },
      ],
      where: {
        viewedAt: {
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd,
        },
      },
      group: ['post.address'],
      raw: true,
    });

    const previousMonthMap: { [key: string]: number } = {};
    previousMonthViews.forEach((item: any) => {
      previousMonthMap[item.address] = parseInt(item.viewCount);
    });

    const result: RegionStats[] = currentMonthViews.map((item: any) => {
      const address = item.address || 'Không xác định';
      const currentViewCount = parseInt(item.viewCount);
      const previousViewCount = previousMonthMap[address] || 0;

      let growthPercentage: number | undefined;
      if (previousViewCount > 0) {
        growthPercentage = ((currentViewCount - previousViewCount) / previousViewCount) * 100;
        growthPercentage = Math.round(growthPercentage * 10) / 10;
      }

      return {
        address,
        viewCount: currentViewCount,
        growthPercentage,
      };
    });

    return result;
  }
}

export default StatisticalService;