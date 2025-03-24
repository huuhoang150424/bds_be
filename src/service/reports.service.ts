
import { Report, Post } from '@models';
import { ProcessingStatus, ReportReason } from "@models/enums";
import { NotFoundError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';



class ReportsService {

  // [createReport]
  static async createReport(data: { userId: string; postId: string; reason: ReportReason; content?: string }) {
    const { userId, postId, reason, content } = data;
    const postExists = await Post.findByPk(postId);
    if (!postExists) {
      throw new NotFoundError("Post not found");
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

  // [getAllReport ] phân trang
  static async getAllReports() {
    return await Report.findAll({ include: ["user", "post"] });
  }


}
export default ReportsService;
