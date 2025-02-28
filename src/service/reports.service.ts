'use-strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Report, Post } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/general-token';
import { ProcessingStatus, ReportReason } from "@models/enums";
import { NotFoundError, UnauthorizedError, transporter, ForbiddenError, TokenError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';



class ReportsService {

  // [createReport]
  static async createReport(data: { userId: string; postId: string; reason: ReportReason; content?: string }) {
    const { userId, postId, reason, content } = data;
    const postExists = await Post.findByPk(postId);
    if (!postExists) {
      throw new NotFoundError("Post not found");
    }
    if (!Object.values(ReportReason).includes(reason)) {
      throw new BadRequestError(`Invalid report reason. Must be one of: ${Object.values(ReportReason).join(", ")}`);
    }
    const report = await Report.create({
      id: uuidv4(),
      userId,
      postId,
      reason,
      content: content || "",
      status: ProcessingStatus.Pending,
    });
    return report.id;
  }
  // [getReportByPostId]
  static async getReportsByPostId(postId: string) {
    return Report.findAll({
      where: { postId },
      include: ["user", "post"],
    });
  }

  // [getAllReport ]
  static async getAllReports() {
    return await Report.findAll({ include: ["user", "post"] });
  }


}
export default ReportsService;
