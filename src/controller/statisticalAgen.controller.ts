'use-strict';

import { Request, Response, NextFunction } from 'express';
import { StatisticalAgenService } from "@service";
import { ApiResponse, BadRequestError, UnauthorizedError } from "@helper";

class StatisticalAgenController {
  //[get view by Address]
  static async getViewByAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    try {
      const data = await StatisticalAgenService.getViewByAddress(userId);
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
      const data = await StatisticalAgenService.getPostByMonth(userId);
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

      const data = await StatisticalAgenService.getTopSearchRegionsWithGrowth(limit);
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
      const data = await StatisticalAgenService.getRecentNewsCount(userId, days);
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

  


  static async getDirectAccessCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      if (req.query.startDate) startDate.setTime(Date.parse(req.query.startDate as string));
      if (req.query.endDate) endDate.setTime(Date.parse(req.query.endDate as string));

      const data = await StatisticalAgenService.getDirectAccessCount(startDate, endDate);
      return res.status(200).json(ApiResponse.success(data, "Thống kê số lượng người truy cập trực tiếp thành công"));
    } catch (error) {
      next(error);
    }
  }

  static async getFeaturedPosts(req: Request, res: Response, next: NextFunction) {
    const { page, limit, offset } = (req as any).pagination;
    try {
      const featuredPosts = await StatisticalAgenService.getFeaturedPosts(page, limit, offset);
      return res.status(200).json(ApiResponse.success(featuredPosts, "Danh sách BĐS nổi bật đã được lấy"));
    } catch (error) {
      next(error);
    }
  }

};
export default StatisticalAgenController;