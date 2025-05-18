'use-strict';

import { Request, Response, NextFunction } from 'express';
import { StatisticalAdminService } from "@service";
import { ApiResponse, BadRequestError, UnauthorizedError } from "@helper";

class StatisticalAdminController {


  static async getUserDemographicStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const year = req.query.year ? Number(req.query.year) : 2025;
      const stats = await StatisticalAdminService.getUserDemographicStatistics(year);
      return res.status(200).json({
        success: true,
        message: "Lấy thống kê phân bổ người dùng thành công",
        data: stats,
      });
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

  static async getMonthlyPropertyStats(req: Request, res: Response): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || 2025; // Lấy năm từ query string, mặc định là 2025
      const stats = await StatisticalAdminService.getMonthlyPropertyStats(year);
      res.status(200).json({
        success: true,
        message: 'Lấy thống kê bất động sản theo tháng thành công',
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý yêu cầu',
      });
    }
  }

};
export default StatisticalAdminController;