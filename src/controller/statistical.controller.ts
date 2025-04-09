'use-strict';

import { Request, Response, NextFunction } from 'express';
import { StatisticalService } from "@service";
import { ApiResponse, BadRequestError, UnauthorizedError } from "@helper";

class StatisticalController {
  //[get view by Address]
  static async getViewByAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    try {
      const data = await StatisticalService.getViewByAddress(userId);
      return res.status(200).json(ApiResponse.success(data, 'Lấy thống kê phân bố khu vực thành công'));
    } catch (error) {
      next(error);
    }
  }
  //[get Post by Month]
  static async getPostByMonth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    try {
      if (!userId) {
        return res.status(400).json(
          ApiResponse.error('UserId không được để trống')
        );
      }
      const data = await StatisticalService.getPostByMonth(userId);
      return res.status(200).json(
        ApiResponse.success(data, 'Thống kê số bài đăng theo tháng thành công')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTopSearchRegionsWithGrowth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5; // Lấy limit từ query param, mặc định là 5
      if (limit <= 0) {
        return res.status(400).json(ApiResponse.error('Limit phải lớn hơn 0'));
      }

      const data = await StatisticalService.getTopSearchRegionsWithGrowth(limit);
      return res.status(200).json(
        ApiResponse.success(data, 'Thống kê top khu vực tìm kiếm trong tháng qua thành công')
      );
    } catch (error) {
      next(error);
    }
  }


  static async getRecentNewsCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = (req as any).user;
      if (!userId) {
        throw new UnauthorizedError("Không tìm thấy userId trong token");
      }
      const days = parseInt(req.query.days as string) || 7;
      if (days <= 0) {
        return res.status(400).json(ApiResponse.error('Số ngày phải lớn hơn 0'));
      }
      const data = await StatisticalService.getRecentNewsCount(userId, days);
      // Format lại ngày bắt đầu và kết thúc thống kê
      const startDate = data.period.start;
      const endDate = data.period.end;
      const formattedStartDate = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
      const formattedEndDate = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;

      return res.status(200).json(
        ApiResponse.success({
          ...data,
          title: `Thống kê tin đăng trong ${days} ngày gần đây`,
          subtitle: `Từ ngày ${formattedStartDate} đến ${formattedEndDate}`,
        }, `Thống kê số lượng tin đăng trong ${days} ngày gần đây thành công`)
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUserAgeStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await StatisticalService.getUserAgeStatistics();
      return res.status(200).json(ApiResponse.success(data, "Thống kê độ tuổi người dùng theo giới tính thành công"));
    } catch (error) {
      next(error);
    }
  }


  static async getTopUsersByPost(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 10;
  
    try {
      const data = await StatisticalService.getTopUsersByPost(limit);
      return res.status(200).json(ApiResponse.success(data, "Thống kê người dùng đăng bài nhiều nhất thành công"));
    } catch (error) {
      console.error("❌ Lỗi khi truy vấn:", error);
      next(error);
    }
  }
  

};
export default StatisticalController;