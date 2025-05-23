import { ActionType, Roles, CategoryNew, Status } from "@models/enums";
import { UserView, Post, User, News, Image, Comment, Wishlist, Report, Pricing, UserPricing, PropertyType } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, fn, col, literal, Sequelize, QueryTypes } from "sequelize";
import {
  MonthlyPostCount, RegionPostStats, DailyNewsCount, CategoryNewsCount, NewsWithStats
}
  from "@interface";


class StatisticalAgenService {
  // getFeaturedPosts 
  static async getFeaturedPosts(page: number, limit: number, offset: number) {
    const countQuery = await sequelize.query(`
        SELECT COUNT(DISTINCT post.id) as total
        FROM posts AS post
        WHERE (SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id) > 3
        AND (SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = post.id) > 5
        AND (SELECT COUNT(*) FROM reports WHERE reports.post_id = post.id) < 2
      `, { type: QueryTypes.SELECT });

    const totalItems = countQuery.length > 0 ? Number((countQuery[0] as any).total) : 0;

    const posts = await Post.findAll({
      limit,
      offset,
      include: [
        { model: User, attributes: ["id", "fullname", "email", "avatar"] },
        { model: Image, attributes: ["imageUrl"] }
      ],
      attributes: [
        "id",
        "title",
        "address",
        "price",
        "squareMeters",
        "bedroom",
        "bathroom",
        "priority",
        "status",
        "slug",
        [Sequelize.literal("(SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id)"), "commentCount"],
        [Sequelize.literal("(SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = post.id)"), "wishlistCount"],
        [Sequelize.literal("(SELECT COUNT(*) FROM reports WHERE reports.post_id = post.id)"), "reportCount"]
      ],
      where: {
        [Op.and]: [
          Sequelize.literal("(SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id) > 3"),
          Sequelize.literal("(SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = post.id) > 5"),
          Sequelize.literal("(SELECT COUNT(*) FROM reports WHERE reports.post_id = post.id) < 2")
        ]
      },
      order: [
        ["priority", "DESC"],
        [Sequelize.literal("(SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = post.id) + (SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id) - (SELECT COUNT(*) FROM reports WHERE reports.post_id = post.id)"), "DESC"]
      ],
      subQuery: false
    });

    const postsWithDetails = posts.map(post => post.get({ plain: true }));

    return {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: postsWithDetails,
    };
  }

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

  static async getTopSearchRegionsWithGrowth(limit: number = 5): Promise<RegionPostStats[]> {
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
        viewed_at: {
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
        viewed_at: {
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

    const result: RegionPostStats[] = currentMonthViews.map((item: any) => {
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



  static async getDirectAccessCount(startDate: Date, endDate: Date): Promise<{ date: string; count: number }[]> {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    type DirectAccessResult = {
      date: string;
      count: string | number;
    };

    const directAccessData = await UserView.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("viewed_at"), "%Y-%m-%d"), "date"],
        [fn("COUNT", col("id")), "count"]
      ],
      where: {
        userId: { [Op.is]: null },
        viewed_at: { [Op.between]: [startDate, endDate] }
      },
      group: [fn("DATE_FORMAT", col("viewed_at"), "%Y-%m-%d")],
      order: [[fn("DATE_FORMAT", col("viewed_at"), "%Y-%m-%d"), "ASC"]],
      raw: true
    }) as unknown as DirectAccessResult[];

    const result: { date: string; count: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = directAccessData.find(item => item.date === dateStr);

      result.push({
        date: dateStr,
        count: existingData ? Number(existingData.count) : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }


}

export default StatisticalAgenService;