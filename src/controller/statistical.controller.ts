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
};
export default StatisticalController;