
import { Appointment, AppointmentHistory, Post, User } from '@models';
import { AppointmentStatus, ActionType } from "@models/enums";
import { NotFoundError, BadRequestError } from '@helper';
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


  static async updateAppointment(
    appointmentId: string,
    userId: string,
    updatedData: Partial<Appointment>,
    changeReason: string = "Không có lý do cụ thể"
  ) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const appointment = await Appointment.findByPk(appointmentId, { transaction });
      if (!appointment) {
        throw new NotFoundError("Cuộc hẹn không tồn tại!");
      }

      if (appointment.requesterId !== userId && appointment.receiverId !== userId) {
        throw new BadRequestError("Bạn không có quyền cập nhật cuộc hẹn này!");
      }

      if (Object.keys(updatedData).length === 0) {
        throw new BadRequestError("Không có dữ liệu nào để cập nhật!");
      }

      const oldStatus = appointment.status;
      const newStatus = updatedData.status && Object.values(AppointmentStatus).includes(updatedData.status)
        ? updatedData.status
        : oldStatus;

      const dataToUpdate = { ...updatedData };
      delete (dataToUpdate as any).changeReason;

      await appointment.update(dataToUpdate, { transaction });

      if (oldStatus !== newStatus) {
        await this.saveAppointmentHistory(
          appointmentId,
          userId,
          oldStatus,
          newStatus,
          changeReason,
          ActionType.UPDATE,
          transaction
        );
      }

      const notifyUserId = userId === appointment.requesterId
        ? appointment.receiverId
        : appointment.requesterId;

      await NotificationService.createNotification(
        notifyUserId,
        `Cuộc hẹn của bạn đã được cập nhật. Trạng thái mới: ${newStatus}`
      );

      return await Appointment.findByPk(appointmentId, { transaction });
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
}
export default AppointmentService;
