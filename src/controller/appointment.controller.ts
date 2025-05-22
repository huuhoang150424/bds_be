'use-strict';

import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '@service';
import { AppointmentStatus } from '@models/enums';
import { ApiResponse, BadRequestError } from '@helper';

class AppointmentController {
  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    const { postId, appointmentTime, duration, message, receiverId } = req.body;
    const { userId } = (req as any)?.user;

    try {
      const newAppointment = await AppointmentService.createAppointment({
        postId,
        userId,
        receiverId,
        appointmentTime,
        duration: duration || 30,
        message,
      });

      return res.status(201).json(ApiResponse.success(newAppointment, 'Đặt lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    const { appointmentId } = req.params;
    const { userId } = (req as any)?.user;
    const updatedData = req.body;
    try {
      await AppointmentService.updateAppointment(appointmentId, userId, updatedData);
      return res.status(200).json(ApiResponse.success(null, 'Cập nhật lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async confirmAppointment(req: Request, res: Response, next: NextFunction) {
    const { appointmentId } = req.params;
    const { userId } = (req as any)?.user;
    const { status, changeReason } = req.body;
    try {
      await AppointmentService.confirmAppointment(appointmentId, userId, status, changeReason);
      return res.status(200).json(ApiResponse.success(null, 'Cập nhật trạng thái lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  // [deleteAppointment]
  static async deleteAppointment(req: Request, res: Response, next: NextFunction) {
    const { appointmentId } = req.params;
    const { userId } = (req as any)?.user;
    try {
      const result = await AppointmentService.deleteAppointment(appointmentId, userId);
      return res.status(200).json(ApiResponse.success(result, 'Cuộc hẹn đã bị hủy!'));
    } catch (error) {
      next(error);
    }
  }

  //[getUserAppointments]
  static async getUserAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as any)?.user;
      const { status } = req.query;

      if (!userId) {
        throw new BadRequestError('Thiếu thông tin `userId`!');
      }
      const validStatus =
        status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)
          ? (status as AppointmentStatus)
          : undefined;

      const appointments = await AppointmentService.getUserAppointments(userId, validStatus);

      return res.status(200).json(ApiResponse.success(appointments, 'Lấy danh sách cuộc hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async getAllAppointmentsByUserId(req: Request, res: Response, next: NextFunction) {
    const { page, limit, offset } = (req as any).pagination;
    const { userId } = (req as any)?.user;
    try {
      const appointments = await AppointmentService.getAllAppointmentsByUserId(userId, page, limit, offset);
      return res.status(200).json(ApiResponse.success(appointments, 'thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { year } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json(ApiResponse.error('Năm không hợp lệ'));
    }

    try {
      const summary = await AppointmentService.getSummary(userId, yearNum);
      return res.status(200).json(ApiResponse.success(summary, 'Lấy thống kê lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async getStatisticalByMonth(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { year } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json(ApiResponse.error('Năm không hợp lệ'));
    }

    try {
      const stats = await AppointmentService.getStatisticalByMonth(userId, yearNum);
      return res.status(200).json(ApiResponse.success(stats, 'Lấy thống kê lịch hẹn theo tháng thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentTypesStats(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { year } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json(ApiResponse.error('Năm không hợp lệ'));
    }

    try {
      const stats = await AppointmentService.getAppointmentTypesStats(userId, yearNum);
      return res.status(200).json(ApiResponse.success(stats, 'Lấy thống kê phân loại lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentTrend(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { year, period } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();
    const periodStr = period ? (period as string) : 'year';

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json(ApiResponse.error('Năm không hợp lệ'));
    }
    if (!['year', 'quarter', 'month'].includes(periodStr)) {
      return res.status(400).json(ApiResponse.error('Khoảng thời gian không hợp lệ'));
    }

    try {
      const stats = await AppointmentService.getAppointmentTrend(userId, yearNum, periodStr);
      return res.status(200).json(ApiResponse.success(stats, 'Lấy thống kê xu hướng lịch hẹn thành công!'));
    } catch (error) {
      next(error);
    }
  }

	static async getPostTypeConversion(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { year } = req.query;
    const yearNum = year ? parseInt(year as string, 10) : new Date().getFullYear();

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json(ApiResponse.error('Năm không hợp lệ'));
    }

    try {
      const stats = await AppointmentService.getPostTypeConversion(userId, yearNum);
      return res.status(200).json(ApiResponse.success(stats, 'Lấy thống kê tỷ lệ chuyển đổi theo loại bài đăng thành công!'));
    } catch (error) {
      next(error);
    }
  }
}
export default AppointmentController;
