
import { Appointment, AppointmentHistory, Post, User } from '@models';
import { AppointmentStatus, ActionType } from "@models/enums";
import { NotFoundError, BadRequestError, ForbiddenError } from '@helper';
import { NotificationService, PostService, UserService } from "@service";
import { v4 as uuidv4 } from 'uuid';
import { Op, Transaction } from "sequelize";
import { sequelize } from '@config/database';




class AppointmentService {
  static async createAppointment(data: {
    postId: string;
		userId:string;
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
		const user=await UserService.getUserById(data.userId);

    await NotificationService.createNotification(
      data.receiverId,
      `Bạn có một cuộc hẹn mới từ ${user.fullname}!`
    );

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
    changeReason: string = 'Không có lý do cụ thể'
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
          transaction
        );
      }
      const notifyUserId = userId === appointment.requesterId ? appointment.receiverId : appointment.requesterId;
      await NotificationService.createNotification(
        notifyUserId,
        `Cuộc hẹn của bạn đã được cập nhật. Trạng thái mới: ${status}`
      );
      return;
    });
  }


  static async deleteAppointment(appointmentId: string, userId: string, reason?: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const appointment = await Appointment.findByPk(appointmentId, { transaction });
      if (!appointment) {
        throw new NotFoundError("Cuộc hẹn không tồn tại!");
      }

      if (appointment.requesterId !== userId && appointment.receiverId !== userId) {
        throw new BadRequestError("Bạn không có quyền hủy cuộc hẹn này!");
      }

      const changeReason = reason || "Người dùng đã hủy cuộc hẹn.";

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
        { transaction }
      );

      if (!historyRecord) {
        throw new Error("Không thể lưu lịch sử cuộc hẹn!");
      }

      await appointment.destroy({ transaction });

      const notifyUserId = userId === appointment.requesterId
        ? appointment.receiverId
        : appointment.requesterId;

      await NotificationService.createNotification(
        notifyUserId,
        `Cuộc hẹn của bạn đã bị hủy. Lý do: ${changeReason}`
      );

      return { message: "Cuộc hẹn đã bị hủy thành công và lịch sử đã được lưu!" };
    });
  }



  static async saveAppointmentHistory(
    appointmentId: string,
    userId: string,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
    changeReason: string,
    action: ActionType,
    transaction: Transaction
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
      { transaction }
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
          as: "requester",
          attributes: ["id", "fullname", "avatar"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "fullname", "avatar"],
        },
        {
          model: Post,
          attributes: ["id", "title", "description"],
        },
      ],
      order: [["appointmentTime", "DESC"]],
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
}
export default AppointmentService;
