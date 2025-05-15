
import { Report, Post, User } from '@models';
import { ProcessingStatus, ReportReason, SeverityStatus } from "@models/enums";
import { NotFoundError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import NotificationService from './notification.service';



class ReportsService {

  // [createReport]
  static async createReport(data: { userId: string; postId: string; reason: ReportReason; content?: string }) {
    const { userId, postId, reason, content } = data;
    const postExists = await Post.findByPk(postId);
    if (!postExists) {
      throw new NotFoundError("Không tìm thấy bài đăng");
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
      attributes: ["id", "postId", "userId", "reason", "content", "status", "createdAt"],
      include: [
        { model: User, attributes: ["id", "fullname", "email", "avatar"] },
        { model: Post, attributes: ["id", "title", "price", "address"] }
      ],
    });
  }
  

  // [getAllReport ] 
  static async getAllReports(page: number, limit: number, offset: number) {
    const { count, rows } = await Report.findAndCountAll({
      limit: limit,
      offset: offset,
      include: [
        {
          model: User,
          attributes: ["id", "fullname", "email", "avatar"], 
        },
        {
          model: Post,
          attributes: ["id", "title",  "address","description","slug","userId"],
					include: [
						{
							model: User,
							attributes: ["id", "fullname", "email", "avatar"], 
						}
					]
        },
      ],
      distinct: true,
      order: [["createdAt", "DESC"]],
    });
  
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }


  static async getReportsSummary() {
    const pendingCount = await Report.count({
      where: { status: ProcessingStatus.Pending }
    });

    const reviewingCount = await Report.count({
      where: { status: ProcessingStatus.Reviewing }
    });

    const resolvedCount = await Report.count({
      where: { status: ProcessingStatus.Resolved }
    });

    const rejectedCount = await Report.count({
      where: { status: ProcessingStatus.Rejected }
    });
    const urgentCount = await Report.count({
      where: { severity: SeverityStatus.Urgent }
    });
    const severityCounts: Record<string, number> = {};
    for (const severity of Object.values(SeverityStatus)) {
      const count = await Report.count({
        where: { severity }
      });
      severityCounts[severity as string] = count;
    }
    const last7DaysCount = await Report.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    });

    const last30DaysCount = await Report.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    });
    const totalCount = await Report.count();
    return {
      processingStatus: {
        pending: pendingCount,
        reviewing: reviewingCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
        total: totalCount
      },
      severityStatus: severityCounts,
      urgentReports: urgentCount,
      recentActivity: {
        last7Days: last7DaysCount,
        last30Days: last30DaysCount
      }
    };
  }


  static async updateReport(reportId: string, data: any) {
    const { status,reason } = data;
    const report = await Report.findByPk(reportId, {
      include: [
        { model: Post, attributes: ['title', 'userId'] },
        { model: User, attributes: ['id', 'fullname'] },
      ],
    });
    if (!report) {
      throw new Error('Không tìm thấy báo cáo');
    }
    await report.update({ status });
    if (status === ProcessingStatus.Resolved || status === ProcessingStatus.Rejected) {
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const message =
        status === ProcessingStatus.Resolved
          ? `Báo cáo của bạn với lý do "${reason}" đã được giải quyết.`
          : `Báo cáo của bạn với lý do "${reason}" đã bị từ chối.`;
      await NotificationService.sendNotification({
        userId: report.userId,
        message,
        priority: 2,
        endDate,
      });
    }

    return report;
  }
}
export default ReportsService;
