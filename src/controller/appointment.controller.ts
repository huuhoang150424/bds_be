'use-strict';

import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from "@service";
import { AppointmentStatus } from "@models/enums";
import { ApiResponse, BadRequestError } from "@helper";


class AppointmentController {
  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, appointmentTime, duration, message } = req.body;
      const requesterId = (req as any)?.user?.userId;
      if (!postId || !appointmentTime) {
        throw new BadRequestError("Thiếu thông tin bắt buộc: `postId`, `appointmentTime`.");
      }
      const newAppointment = await AppointmentService.createAppointment({
        postId,
        requesterId,
        appointmentTime,
        duration: duration || 30,
        message,
      });

      return res.status(201).json(ApiResponse.success(newAppointment, "Đặt lịch hẹn thành công!"));
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const userId = (req as any).user?.userId;
      const updatedData = req.body;
      const changeReason = updatedData.changeReason ?? "Không có lý do cụ thể";

      if (!appointmentId) {
        throw new BadRequestError("Thiếu `appointmentId`!");
      }

      if (!updatedData || Object.keys(updatedData).length === 0) {
        throw new BadRequestError("Không có dữ liệu nào để cập nhật!");
      }

      if (!updatedData.status || !Object.values(AppointmentStatus).includes(updatedData.status)) {
        throw new BadRequestError("Trạng thái cuộc hẹn không hợp lệ!");
      }

      const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, userId, updatedData, changeReason);
      return res.status(200).json(ApiResponse.success(updatedAppointment, "Cập nhật lịch hẹn thành công!"));
    } catch (error) {
      next(error);
    }
  }

  // [deleteAppointment]
  static async deleteAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const userId = (req as any).user?.userId;

      if (!appointmentId) {
        throw new BadRequestError("Thiếu `appointmentId`!");
      }
      const result = await AppointmentService.deleteAppointment(appointmentId, userId);
      return res.status(200).json(ApiResponse.success(result, "Cuộc hẹn đã bị hủy!"));
    } catch (error) {
      next(error);
    }
  }

  //[getUserAppointments]
  static async getUserAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user?.userId;
      const { status } = req.query;

      if (!userId) {
        throw new BadRequestError("Thiếu thông tin `userId`!");
      }
      const validStatus = status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)
        ? (status as AppointmentStatus)
        : undefined;

      const appointments = await AppointmentService.getUserAppointments(userId, validStatus);

      return res.status(200).json(ApiResponse.success(appointments, "Lấy danh sách cuộc hẹn thành công!"));
    } catch (error) {
      next(error);
    }
  }
}
export default AppointmentController;
