import { ActionType, Roles, CategoryNew, Status } from "@models/enums";
import { UserView, Post, User, News, Image, Comment, Wishlist, Report, Pricing, UserPricing, PropertyType } from "@models";
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from "@helper";
import { sequelize } from '@config/database';
import { Op, fn, col, literal, Sequelize, QueryTypes } from "sequelize";
import {
  AgeGenderStats, TopUsersStats, MonthlyStats, MonthlyRevenue, RevenueStats, PropertyTypeStats, RegionDistributionStats, PriceRangeStats, PostDistributionStats
}
  from "@interface";


class StatisticalAdminService {

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

  // Lấy thống kê tháng hiện tại
  static async getMonthlyStats(): Promise<MonthlyStats> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Tính tổng doanh thu (từ user_pricings liên kết với pricings)
    const revenueQuery = await sequelize.query(`
      SELECT SUM(p.price) as totalRevenue
      FROM user_pricings up
      JOIN pricings p ON up.pricing_id = p.id
      WHERE up.created_at >= :startOfMonth 
        AND up.created_at <= :endOfMonth
        AND up.status = :completed
    `, {
      replacements: {
        startOfMonth,
        endOfMonth,
        completed: Status.COMPLETED
      },
      type: QueryTypes.SELECT
    });

    const totalRevenue = revenueQuery.length > 0 ? Number((revenueQuery[0] as any).totalRevenue) || 0 : 0;

    // 2. Đếm người dùng mới
    const newUsersCount = await User.count({
      where: {
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // 3. Đếm số gói dịch vụ đã bán
    const soldPricingsCount = await UserPricing.count({
      where: {
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // 4. Đếm số bài đăng mới
    const newPostsCount = await Post.count({
      where: {
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    return {
      totalRevenue,
      newUsers: newUsersCount,
      soldPricings: soldPricingsCount,
      newPosts: newPostsCount
    };
  }

  // Doanh Thu Theo từng tháng
  static async getMonthlyRevenueStats(year?: number): Promise<RevenueStats> {
    const currentYear = year || new Date().getFullYear(); // Mặc định là năm hiện tại (2025)

    // Kiểm tra năm hợp lệ
    if (currentYear < 2000 || currentYear > 2100) {
      throw new BadRequestError('Năm không hợp lệ, phải nằm trong khoảng 2000-2100');
    }

    // Truy vấn doanh thu từng tháng trong năm được chỉ định
    const revenueQuery = await sequelize.query(`
      SELECT 
        MONTH(up.created_at) as month,
        COALESCE(SUM(p.price), 0) as revenue
        FROM user_pricings up
        JOIN pricings p ON up.pricing_id = p.id
        WHERE YEAR(up.created_at) = :currentYear
        AND up.status = :completed
        GROUP BY MONTH(up.created_at)
    `, {
      replacements: {
        currentYear,
        completed: Status.COMPLETED
      },
      type: QueryTypes.SELECT
    });

    // Tạo mảng doanh thu cho 12 tháng, mặc định là 0
    const monthlyRevenue: MonthlyRevenue[] = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      revenue: 0
    }));

    // Gán doanh thu từ truy vấn vào các tháng tương ứng
    revenueQuery.forEach((row: any) => {
      const monthIndex = Number(row.month) - 1; // MONTH trả về 1-12, chuyển về index 0-11
      monthlyRevenue[monthIndex] = {
        month: Number(row.month),
        revenue: Number(row.revenue) || 0
      };
    });

    return {
      year: currentYear,
      monthlyRevenue
    };
  }

  static async getPostDistributionStats(year?: number): Promise<PostDistributionStats> {
    const currentYear = year || new Date().getFullYear(); // Mặc định là năm hiện tại (2025)

    // Kiểm tra năm hợp lệ
    if (currentYear < 2000 || currentYear > 2100) {
      throw new BadRequestError('Năm không hợp lệ, phải nằm trong khoảng 2000-2100');
    }

    // 1. Thống kê theo loại hình (property_types.name)
    const propertyTypeResults = await Post.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Post.id')), 'count']
      ],
      include: [
        {
          model: PropertyType,
          attributes: ['name'],
          required: true,
          as: 'propertyType'
        }
      ],
      where: {
        created_at: {
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('Post.created_at')), currentYear)
          ]
        },
        status: { [Op.ne]: 'Đã bàn giao' }
      },
      group: ['propertyType.name'],
      raw: true
    });

    const totalPropertyPosts = propertyTypeResults.reduce((sum, row: any) => sum + Number(row.count), 0);
    const propertyTypeDistribution: PropertyTypeStats[] = propertyTypeResults.map((row: any) => ({
      name: row['propertyType.name'],
      percentage: totalPropertyPosts > 0 ? Number(((Number(row.count) / totalPropertyPosts) * 100).toFixed(2)) : 0
    }));

    // 2. Thống kê theo khu vực (posts.address)
    const regionResults = await Post.findAll({
      attributes: [
        'address',
        [sequelize.fn('COUNT', sequelize.col('Post.id')), 'count']
      ],
      where: {
        created_at: {
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('Post.created_at')), currentYear)
          ]
        },
        status: { [Op.ne]: 'Đã bàn giao' }
      },
      group: ['Post.address'],
      raw: true
    });

    // Phân loại khu vực và tính tỷ lệ phần trăm
    const regionMap: { [key: string]: number } = {
      'Hà Nội': 0,
      'Đà Nẵng': 0,
      'TP.HCM': 0,
      'Khác': 0
    };

    regionResults.forEach((row: any) => {
      const address: string = row.address || '';
      let region: string;
      if (address.includes('Hà Nội')) {
        region = 'Hà Nội';
      } else if (address.includes('Đà Nẵng') || address.includes('Đà Năng')) {
        region = 'Đà Nẵng';
      } else if (address.includes('HCM')) {
        region = 'TP.HCM';
      } else {
        region = 'Khác';
      }
      regionMap[region] += Number(row.count);
    });

    const totalRegionPosts = Object.values(regionMap).reduce((sum, count) => sum + count, 0);
    const regionDistribution: RegionDistributionStats[] = Object.entries(regionMap).map(([name, count]) => ({
      name,
      percentage: totalRegionPosts > 0 ? Number(((count / totalRegionPosts) * 100).toFixed(2)) : 0
    }));

    // 3. Thống kê theo khoảng giá (posts.price)
    const priceResults = await Post.findAll({
      attributes: [
        'price',
        [sequelize.fn('COUNT', sequelize.col('Post.id')), 'count']
      ],
      where: {
        created_at: {
          [Op.and]: [
            sequelize.where(sequelize.fn('YEAR', sequelize.col('Post.created_at')), currentYear)
          ]
        },
        status: { [Op.ne]: 'Đã bàn giao' }
      },
      group: ['Post.price'],
      raw: true
    });

    // Phân loại khoảng giá
    const priceRanges = ['< 1 tỷ', '1 - 2 tỷ', '2 - 5 tỷ', '5 - 10 tỷ', '> 10 tỷ'];
    const priceMap: { [key: string]: number } = {
      '< 1 tỷ': 0,
      '1 - 2 tỷ': 0,
      '2 - 5 tỷ': 0,
      '5 - 10 tỷ': 0,
      '> 10 tỷ': 0
    };

    priceResults.forEach((row: any) => {
      const price: number = Number(row.price) || 0;
      let range: string;
      if (price < 1000000000) {
        range = '< 1 tỷ';
      } else if (price >= 1000000000 && price <= 2000000000) {
        range = '1 - 2 tỷ';
      } else if (price > 2000000000 && price <= 5000000000) {
        range = '2 - 5 tỷ';
      } else if (price > 5000000000 && price <= 10000000000) {
        range = '5 - 10 tỷ';
      } else {
        range = '> 10 tỷ';
      }
      priceMap[range] += Number(row.count);
    });

    const priceRangeDistribution: PriceRangeStats[] = priceRanges.map(range => ({
      range,
      count: priceMap[range]
    }));

    return {
      propertyTypeDistribution,
      regionDistribution,
      priceRangeDistribution
    };
  }



}

export default StatisticalAdminService;