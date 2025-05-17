'use-strict';

import { Request, Response, NextFunction } from 'express';
import { StatisticalAdminService } from "@service";
import { ApiResponse, BadRequestError, UnauthorizedError } from "@helper";

class StatisticalAdminController {


  static async getUserAgeStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await StatisticalAdminService.getUserAgeStatistics();
      return res.status(200).json(ApiResponse.success(data, "Thống kê độ tuổi người dùng theo giới tính thành công"));
    } catch (error) {
      next(error);
    }
  }


  static async getTopUsersByPost(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const data = await StatisticalAdminService.getTopUsersByPost(limit);
      return res.status(200).json(ApiResponse.success(data, "Thống kê người dùng đăng bài nhiều nhất thành công"));
    } catch (error) {
      console.error("❌ Lỗi khi truy vấn:", error);
      next(error);
    }
  }

  static async getMonthlyStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    try {
      const data = await StatisticalAdminService.getMonthlyStats();
      return res.status(200).json(ApiResponse.success(data, 'Lấy thống kê tháng hiện tại thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyRevenueStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const { year } = req.query;
    try {
      const parsedYear = year ? parseInt(year as string, 10) : undefined;
      const data = await StatisticalAdminService.getMonthlyRevenueStats(parsedYear);
      return res.status(200).json(ApiResponse.success(data, 'Lấy thống kê doanh thu theo tháng thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async getPostDistributionStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const { year } = req.query; // Lấy tham số year từ query string
    try {
      const parsedYear = year ? parseInt(year as string, 10) : undefined;
      const data = await StatisticalAdminService.getPostDistributionStats(parsedYear);
      return res.status(200).json(ApiResponse.success(data, 'Lấy thống kê phân bổ bài đăng thành công'));
    } catch (error) {
      next(error);
    }
  }

};
export default StatisticalAdminController;