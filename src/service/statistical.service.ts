import { ActionType, Roles, CategoryNew } from "@models/enums";
import { UserView, Post, User, News } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, fn, col, literal, Sequelize } from "sequelize";
import {MonthlyPostCount, RegionStats,DailyNewsCount, CategoryNewsCount, NewsWithStats, AgeGenderStats, TopUsersStats} from "@interface";


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


  static async getRecentNewsCount(userId: string, days: number = 7): Promise<NewsWithStats> {
    if (!userId) {
      throw new BadRequestError('UserId không được để trống');
    }
    if (days <= 0) {
      throw new BadRequestError('Số ngày phải lớn hơn 0');
    }

    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - days);

    // Lấy tổng số tin đăng trong khoảng thời gian
    const recentNewsCount = await News.count({
      where: {
        created_at: {
          [Op.gte]: pastDate,
          [Op.lte]: currentDate,
        },
      }
    });

    // Lấy danh sách tin đăng mới nhất để hiển thị
    const recentNews = await News.findAll({
      where: {
        created_at: {
          [Op.gte]: pastDate,
          [Op.lte]: currentDate,
        },
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullname', 'avatar'],
        },
      ],
      attributes: ['id', 'title', 'imageUrl', 'created_at', 'slug', 'category', 'view'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Thống kê tin đăng theo ngày
    const dailyStats = await News.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: pastDate,
          [Op.lte]: currentDate,
        },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    }) as unknown as DailyNewsCount[];

    // Thống kê tin đăng theo danh mục
    const categoryStats = await News.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: pastDate,
          [Op.lte]: currentDate,
        },
      },
      group: ['category'],
      order: [[literal('count'), 'DESC']],
      raw: true
    }) as unknown as CategoryNewsCount[];

    // Tạo mảng đầy đủ các ngày trong khoảng thời gian
    const dateArray = [];
    const tempDate = new Date(pastDate);

    while (tempDate <= currentDate) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const found = dailyStats.find((item) => item.date === dateStr);

      dateArray.push({
        date: dateStr,
        count: found ? parseInt(found.count) : 0,
        formattedDate: `${tempDate.getDate()}/${tempDate.getMonth() + 1}`
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Tính phần trăm tăng trưởng so với khoảng thời gian trước đó
    const previousPeriodStartDate = new Date(pastDate);
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - days);

    const previousPeriodNewsCount = await News.count({
      where: {
        created_at: {
          [Op.gte]: previousPeriodStartDate,
          [Op.lt]: pastDate,
        },
      }
    });

    // Tính phần trăm tăng trưởng
    const growthPercentage = previousPeriodNewsCount > 0
      ? Math.round(((recentNewsCount - previousPeriodNewsCount) / previousPeriodNewsCount) * 100 * 10) / 10
      : 0;

    // Tính tổng view của tất cả tin đăng trong khoảng thời gian
    const totalViews = await News.sum('view', {
      where: {
        created_at: {
          [Op.gte]: pastDate,
          [Op.lte]: currentDate,
        },
      }
    }) as number;

    // Tạo đầy đủ danh sách các danh mục, thêm những danh mục không có tin
    const allCategories = Object.values(CategoryNew);
    const fullCategoryStats = allCategories.map(category => {
      const found = categoryStats.find((item) => item.category === category);
      return {
        category,
        count: found ? parseInt(found.count) : 0
      };
    }).sort((a, b) => b.count - a.count);

    return {
      recentNewsCount,
      totalViews: totalViews || 0,
      growthPercentage,
      period: {
        start: pastDate,
        end: currentDate,
        days
      },
      dailyStats: dateArray,
      categoryStats: fullCategoryStats,
      recentNews
    };
  }

  //[get user age]
  static async getUserAgeStatistics(): Promise<AgeGenderStats[]> {
    const currentYear = new Date().getFullYear();

    // Xác định khoảng tuổi
    const ageRanges = [
      { label: "Dưới 18", min: 0, max: 17 },
      { label: "18 - 24", min: 18, max: 24 },
      { label: "25 - 34", min: 25, max: 34 },
      { label: "35 - 44", min: 35, max: 44 },
      { label: "45 - 54", min: 45, max: 54 },
      { label: "55 - 64", min: 55, max: 64 },
      { label: "65 trở lên", min: 65, max: 200 },
    ];

    const statsPromises = ageRanges.map(async (range) => {
      const minBirthYear = currentYear - range.max;
      const maxBirthYear = currentYear - range.min;

      const maleCount = await User.count({
        where: {
          gender: "Male",
          dateOfBirth: { [Op.between]: [new Date(`${minBirthYear}-01-01`), new Date(`${maxBirthYear}-12-31`)] },
        },
      });

      const femaleCount = await User.count({
        where: {
          gender: "Female",
          dateOfBirth: { [Op.between]: [new Date(`${minBirthYear}-01-01`), new Date(`${maxBirthYear}-12-31`)] },
        },
      });

      const otherCount = await User.count({
        where: {
          gender: "Other",
          dateOfBirth: { [Op.between]: [new Date(`${minBirthYear}-01-01`), new Date(`${maxBirthYear}-12-31`)] },
        },
      });

      return {
        ageGroup: range.label,
        male: maleCount,
        female: femaleCount,
        other: otherCount,
      };
    });

    return Promise.all(statsPromises);
  }
  
  //[get top user by post]
  static async getTopUsersByPost(limit: number = 10): Promise<TopUsersStats[]> {

    const users = await User.findAll({
      attributes: [
        "id",
        "fullname",
        "email",
        "avatar",
        [sequelize.literal("(SELECT COUNT(*) FROM posts WHERE posts.user_id = User.id)"), "postCount"] 
      ],
      order: [[sequelize.literal("postCount"), "DESC"]],
      limit,
      raw: true,
    });
    return users as unknown as TopUsersStats[];
  }



}

export default StatisticalService;