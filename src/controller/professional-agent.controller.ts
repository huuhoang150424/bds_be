'use-strict';

import { Request, Response, NextFunction } from 'express';
import { ProfessionalAgentService } from "@service";
import { ApiResponse, BadRequestError, UnauthorizedError } from "@helper";

class ProfessionalAgentController {
  static async checkProfessionalStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await ProfessionalAgentService.checkProfessionalStatus();
      return res.status(200).json(
        ApiResponse.success(
          results,
          "Đã hoàn thành kiểm tra trạng thái môi giới chuyên nghiệp"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProfessionalAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await ProfessionalAgentService.getProfessionalAgents();
      return res.status(200).json(
        ApiResponse.success(
          agents,
          "Danh sách môi giới chuyên nghiệp"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async checkUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await ProfessionalAgentService.checkSingleUserStatus(userId);
      return res.status(200).json(
        ApiResponse.success(
          result,
          "Đã kiểm tra trạng thái người dùng"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async checkUserCriteria(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as any).user;
      if (!userId) {
        return res.status(400).json({
          status: 400,
          message: "Thiếu `userId` trong request"
        });
      }
      const isQualified = await ProfessionalAgentService.checkUserCriteria(userId);
      return res.status(200).json({
        status: 200,
        userId,
        isProfessional: isQualified,
        message: isQualified
          ? "✅ Người dùng đủ điều kiện trở thành môi giới chuyên nghiệp!"
          : "❌ Người dùng chưa đủ tiêu chí để trở thành môi giới chuyên nghiệp."
      });
    } catch (error) {
      next(error);
    }
  }

};
export default ProfessionalAgentController;