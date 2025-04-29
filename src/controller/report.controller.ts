'use-strict';

import { Request, Response, NextFunction } from 'express';
import { ReportsService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class ReportsController {
  // [createReport]
  static async createReport(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any)?.user?.userId;
    const { postId, reason, content } = req.body;
    if (!userId || !postId || !reason) {
      throw new BadRequestError("Missing required fields: userId, postId, or reason.");
    }
    try {
      const reportId = await ReportsService.createReport({ userId, postId, reason, content });
      return res.status(201).json(new ApiResponse(201, reportId, "Tạo báo cáo thành công"));
    } catch (error) {
      next(error);
    }
  }

  // [getReportByPostId]
  static async getReportsByPostId(req: Request, res: Response, next: NextFunction) {
    const { postId } = req.params;
    if (!postId) {
      throw new BadRequestError("Post ID is required.");
    }
    try {
      const reports = await ReportsService.getReportsByPostId(postId);
      return res.status(200).json(new ApiResponse(200, "Reports retrieved successfully", reports));
    } catch (error) {
      next(error);
    }
  }

  // [getAllReport ]
  static async getAllReports(req: Request, res: Response, next: NextFunction) {
    const { page, limit, offset } = (req as any).pagination;
    try {
      const reports = await ReportsService.getAllReports(page, limit, offset);
      return res.status(200).json(ApiResponse.success(reports, "Danh sách báo cáo đã được lấy thành công"));
    } catch (error) {
      next(error);
    }
  }

  static async getReportsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await ReportsService.getReportsSummary();
      return res.status(200).json(ApiResponse.success(summary, "Thành công"));
    } catch (error) {
      next(error);
    }
  }
  

}
export default ReportsController;
