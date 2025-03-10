'use-strict';

import { Request, Response, NextFunction } from 'express';
import { ReportsService } from "@service";
import { ApiResponse, BadRequestError } from "@helper";

class ReportsController {
  // [createReport]
  static async createReport(req: Request, res: Response, next: NextFunction) {
    const { userId, postId, reason, content } = req.body;
    if (!userId || !postId || !reason) {
      throw new BadRequestError("Missing required fields: userId, postId, or reason.");
    }
    try {
      const reportId = await ReportsService.createReport({ userId, postId, reason, content });
      return res.status(201).json(new ApiResponse(201, reportId, "Report created successfully"));
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
    try {
      const reports = await ReportsService.getAllReports();
      return res.status(200).json(ApiResponse.success(reports, "All reports retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

}
export default ReportsController;
