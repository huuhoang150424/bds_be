import { Appointment, AppointmentHistory, Post, User } from '@models';
import { AppointmentStatus, ActionType } from '@models/enums';
import { NotFoundError, BadRequestError, ForbiddenError } from '@helper';
import { NotificationService, PostService, UserService } from '@service';
import { v4 as uuidv4 } from 'uuid';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '@config/database';

interface TrendData {
  month: string;
  current: number;
  previous: number;
}

interface PostTypeConversionData {
  type: string;
  appointments: number;
  conversionRate: number;
}
class AppointmentService {
  static async createAppointment(data: {
    postId: string;
    userId: string;
    receiverId: string;
    appointmentTime: Date;
    duration?: number;
    message?: string;
  }) {
    const newAppointment = await Appointment.create({
      id: uuidv4(),
      postId: data.postId,
      requesterId: data.userId,
      receiverId: data.receiverId,
      appointmentTime: data.appointmentTime,
      duration: data.duration || 30,
      status: AppointmentStatus.Pending,
      message: data.message,
    });
    const user = await UserService.getUserById(data.userId);

    await NotificationService.createNotification(data.receiverId, `Bạn có một cuộc hẹn mới từ ${user.fullname}!`);

    return newAppointment;
  }

  static async updateAppointment(appointmentId: string, userId: string, updatedData: Partial<Appointment>) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'fullname', 'avatar'],
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'fullname', 'avatar'],
          },
          {
            model: Post,
            attributes: ['id', 'title', 'description'],
          },
        ],
        transaction,
      });
      if (!appointment) {
        throw new NotFoundError('Cuộc hẹn không tồn tại!');
      }
      if (appointment.requesterId !== userId && appointment.receiverId !== userId) {
        throw new ForbiddenError('Bạn không có quyền cập nhật cuộc hẹn này!');
      }
      if (Object.keys(updatedData).length === 0) {
        throw new BadRequestError('Không có dữ liệu nào để cập nhật!');
      }
      await appointment.update(updatedData, { transaction });
      return;
    });
  }

  static async confirmAppointment(
    appointmentId: string,
    userId: string,
    status: AppointmentStatus,
    changeReason: string = 'Không có lý do cụ thể',
  ) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      if (!Object.values(AppointmentStatus).includes(status)) {
        throw new BadRequestError('Trạng thái không hợp lệ!');
      }
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'fullname', 'avatar'],
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'fullname', 'avatar'],
          },
          {
            model: Post,
            attributes: ['id', 'title', 'description'],
          },
        ],
        transaction,
      });
      if (!appointment) {
        throw new NotFoundError('Cuộc hẹn không tồn tại!');
      }
      if (appointment.requesterId !== userId && appointment.receiverId !== userId) {
        throw new ForbiddenError('Bạn không có quyền cập nhật trạng thái cuộc hẹn này!');
      }
      const oldStatus = appointment.status;
      if (status === AppointmentStatus.Confirmed || status === AppointmentStatus.Rejected) {
        if (appointment.receiverId !== userId) {
          throw new ForbiddenError('Chỉ người nhận cuộc hẹn có thể xác nhận hoặc từ chối!');
        }
        if (appointment.status !== AppointmentStatus.Pending) {
          throw new BadRequestError('Cuộc hẹn phải ở trạng thái chờ xác nhận để xác nhận hoặc từ chối!');
        }
      }
      if (status === AppointmentStatus.Cancelled) {
        if (appointment.status === AppointmentStatus.Completed) {
          throw new BadRequestError('Không thể hủy cuộc hẹn đã hoàn thành!');
        }
        if (appointment.status === AppointmentStatus.Cancelled) {
          throw new BadRequestError('Cuộc hẹn đã bị hủy trước đó!');
        }
      }
      if (status === AppointmentStatus.Completed) {
        if (appointment.receiverId !== userId) {
          throw new ForbiddenError('Chỉ người nhận cuộc hẹn có thể đánh dấu hoàn thành!');
        }
        if (appointment.status !== AppointmentStatus.Confirmed) {
          throw new BadRequestError('Cuộc hẹn phải ở trạng thái đã xác nhận để đánh dấu hoàn thành!');
        }
      }
      if (status === AppointmentStatus.Rescheduled) {
        if (appointment.status === AppointmentStatus.Completed || appointment.status === AppointmentStatus.Cancelled) {
          throw new BadRequestError('Không thể lên lịch lại cho cuộc hẹn đã hoàn thành hoặc đã hủy!');
        }
      }
      await appointment.update({ status }, { transaction });
      if (oldStatus !== status) {
        await this.saveAppointmentHistory(
          appointmentId,
          userId,
          oldStatus,
          status,
          changeReason,
          ActionType.UPDATE,
          transaction,
        );
      }
      const notifyUserId = userId === appointment.requesterId ? appointment.receiverId : appointment.requesterId;
      await NotificationService.createNotification(
        notifyUserId,
        `Cuộc hẹn của bạn đã được cập nhật. Trạng thái mới: ${status}`,
      );
      return;
    });
  }

  static async deleteAppointment(appointmentId: string, userId: string, reason?: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const appointment = await Appointment.findByPk(appointmentId, { transaction });
      if (!appointment) {
        throw new NotFoundError('Cuộc hẹn không tồn tại!');
      }

      if (appointment.requesterId !== userId && appointment.receiverId !== userId) {
        throw new BadRequestError('Bạn không có quyền hủy cuộc hẹn này!');
      }

      const changeReason = reason || 'Người dùng đã hủy cuộc hẹn.';

      const historyRecord = await AppointmentHistory.create(
        {
          id: uuidv4(),
          appointmentId,
          changedBy: userId,
          oldStatus: appointment.status,
          newStatus: AppointmentStatus.Cancelled,
          changeReason,
          action: ActionType.DELETE,
          changedAt: new Date(),
        },
        { transaction },
      );

      if (!historyRecord) {
        throw new Error('Không thể lưu lịch sử cuộc hẹn!');
      }

      await appointment.destroy({ transaction });

      const notifyUserId = userId === appointment.requesterId ? appointment.receiverId : appointment.requesterId;

      await NotificationService.createNotification(notifyUserId, `Cuộc hẹn của bạn đã bị hủy. Lý do: ${changeReason}`);

      return { message: 'Cuộc hẹn đã bị hủy thành công và lịch sử đã được lưu!' };
    });
  }

  static async saveAppointmentHistory(
    appointmentId: string,
    userId: string,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
    changeReason: string,
    action: ActionType,
    transaction: Transaction,
  ) {
    return await AppointmentHistory.create(
      {
        id: uuidv4(),
        appointmentId,
        changedBy: userId,
        oldStatus,
        newStatus,
        changeReason,
        action,
        changedAt: new Date(),
      },
      { transaction },
    );
  }

  //[getUserAppointments]
  static async getUserAppointments(userId: string, status?: AppointmentStatus) {
    const whereClause: any = {
      [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
    };

    if (status) {
      whereClause.status = status;
    }

    return await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'fullname', 'avatar'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullname', 'avatar'],
        },
        {
          model: Post,
          attributes: ['id', 'title', 'description'],
        },
      ],
      order: [['appointmentTime', 'DESC']],
    });
  }

  static async getAllAppointmentsByUserId(userId: string, page: number, limit: number, offset: number) {
    const { rows, count } = await Appointment.findAndCountAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'fullname', 'avatar'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullname', 'avatar'],
        },
        {
          model: Post,
          attributes: ['id', 'title', 'description'],
        },
      ],
      order: [['appointmentTime', 'DESC']],
      limit,
      offset,
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async getSummary(userId: string, year: number = new Date().getFullYear()) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const previousStartDate = new Date(year - 1, 0, 1);
    const previousEndDate = new Date(year, 0, 1);

    const currentAppointments = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointmentTime: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const totalAppointments = currentAppointments.length;
    const previousAppointments = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointmentTime: {
          [Op.between]: [previousStartDate, previousEndDate],
        },
      },
    });

    const previousCount = previousAppointments.length;
    const growthRate =
      previousCount > 0
        ? (((totalAppointments - previousCount) / previousCount) * 100).toFixed(1)
        : totalAppointments > 0
          ? '100.0'
          : '0.0';
    const daysInYear = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const averageDaily = totalAppointments > 0 ? (totalAppointments / daysInYear).toFixed(1) : '0.0';
    const completedAppointments = currentAppointments.filter(
      (appt) => appt.status === AppointmentStatus.Completed,
    ).length;
    const completionRate =
      totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : '0.0';

    return {
      totalAppointments,
      growthRate: `${growthRate}%`,
      averageDaily,
      completionRate: `${completionRate}%`,
    };
  }

  static async getStatisticalByMonth(userId: string, year: number = new Date().getFullYear()) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const appointments = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointment_time: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('appointment_time'), '%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['month'],
      order: [[sequelize.literal('month'), 'ASC']],
      raw: true,
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      count: 0,
    }));

    appointments.forEach((appt: any) => {
      const monthIndex = parseInt(appt.month, 10) - 1;
      months[monthIndex].count = parseInt(appt.count, 10);
    });

    return months;
  }

  static async getAppointmentTypesStats(userId: string, year: number = new Date().getFullYear()) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const appointments = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointment_time: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: ['id', 'duration', 'message'],
      raw: true,
    });

    const stats = [
      { name: 'Tư vấn mua', value: 0 },
      { name: 'Tư vấn thuê', value: 0 },
      { name: 'Xem nhà', value: 0 },
      { name: 'Ký hợp đồng', value: 0 },
    ];

    appointments.forEach((appt: any) => {
      const message = (appt.message || '').toLowerCase();
      if (
        message.includes('contract') ||
        message.includes('sign') ||
        message.includes('deal') ||
        message.includes('ký')
      ) {
        stats[3].value += 1; // Ký hợp đồng
      } else if (
        (message.includes('view') || message.includes('visit') || message.includes('xem')) &&
        appt.duration > 30 &&
        appt.duration <= 60
      ) {
        stats[2].value += 1; // Xem nhà
      } else if (message.includes('rent') || message.includes('lease') || message.includes('thuê')) {
        stats[1].value += 1; // Tư vấn thuê
      } else {
        stats[0].value += 1; // Tư vấn mua
      }
    });

    return stats;
  }

  static async getAppointmentTrend(
    userId: string,
    year: number = new Date().getFullYear(),
    period: string = 'year',
  ): Promise<TrendData[]> {
    const currentStart = new Date(year, 0, 1);
    const currentEnd = new Date(year + 1, 0, 1);
    const previousStart = new Date(year - 1, 0, 1);
    const previousEnd = new Date(year, 0, 1);

    let groupBy: string;
    let format: string;
    let items: number;
    let labels: string[];

    switch (period) {
      case 'quarter':
        groupBy = 'MONTH';
        format = '%m';
        items = 3;
        labels = ['Tháng 1', 'Tháng 2', 'Tháng 3'];
        break;
      case 'month':
        groupBy = 'WEEK';
        format = '%U';
        items = 4;
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        break;
      case 'year':
      default:
        groupBy = 'MONTH';
        format = '%m';
        items = 12;
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        break;
    }

    const currentStats = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointment_time: {
          [Op.between]: [currentStart, currentEnd],
        },
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('appointment_time'), format), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['period'],
      order: [[sequelize.literal('period'), 'ASC']],
      raw: true,
    });

    const previousStats = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointment_time: {
          [Op.between]: [previousStart, previousEnd],
        },
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('appointment_time'), format), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['period'],
      order: [[sequelize.literal('period'), 'ASC']],
      raw: true,
    });

    const result: TrendData[] = Array.from({ length: items }, (_, i) => ({
      month: labels[i],
      current: 0,
      previous: 0,
    }));

    currentStats.forEach((stat: any) => {
      const index = period === 'month' ? parseInt(stat.period, 10) : parseInt(stat.period, 10) - 1;
      if (index >= 0 && index < items) {
        result[index].current = parseInt(stat.count, 10);
      }
    });

    previousStats.forEach((stat: any) => {
      const index = period === 'month' ? parseInt(stat.period, 10) : parseInt(stat.period, 10) - 1;
      if (index >= 0 && index < items) {
        result[index].previous = parseInt(stat.count, 10);
      }
    });

    return result;
  }

  static async getPostTypeConversion(userId: string, year: number = new Date().getFullYear()): Promise<PostTypeConversionData[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const appointments = await Appointment.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { receiverId: userId }],
        appointment_time: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Post,
          attributes: ['title'],
          required: true,
        },
      ],
      attributes: [
        [sequelize.col('Post.title'), 'title'],
        [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'total'],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal(`CASE WHEN Appointment.status = '${AppointmentStatus.Completed}' AND (Appointment.message LIKE '%ký%' OR Appointment.message LIKE '%contract%' OR Appointment.message LIKE '%sign%' OR Appointment.message LIKE '%deal%') THEN 1 ELSE 0 END`)
          ),
          'successful',
        ],
      ],
      group: ['Post.title'],
      raw: true,
    });

    const types = ['Căn hộ', 'Nhà phố', 'Đất nền', 'Biệt thự', 'Khác'];
    const result: PostTypeConversionData[] = types.map((type) => ({
      type,
      appointments: 0,
      conversionRate: 0,
    }));

    appointments.forEach((appt: any) => {
      const title = (appt.title || '').toLowerCase();
      let typeIndex = 4; // Mặc định: Khác
      if (title.includes('căn hộ')) typeIndex = 0;
      else if (title.includes('nhà phố')) typeIndex = 1;
      else if (title.includes('đất nền')) typeIndex = 2;
      else if (title.includes('biệt thự')) typeIndex = 3;

      const total = parseInt(appt.total, 10);
      const successful = parseInt(appt.successful, 10);
      result[typeIndex].appointments += total;
      result[typeIndex].conversionRate = result[typeIndex].appointments > 0
        ? (result[typeIndex].appointments > 0 ? (successful / total) * 100 : 0) * total / result[typeIndex].appointments
        : 0;
    });

    return result;
  }
}
export default AppointmentService;
