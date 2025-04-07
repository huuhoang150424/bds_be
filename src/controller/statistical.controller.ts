'use-strict';

import { Request, Response, NextFunction } from 'express';
import { StatisticalService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

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
};
export default StatisticalController;