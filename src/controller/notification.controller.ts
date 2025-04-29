'use strict';

import { Request, Response, NextFunction } from 'express';
import {NotificationService} from '@service';
import { ApiResponse } from '@helper';

class NotificationController {
	static async getAllNotification(req: Request, res: Response, next: NextFunction) {

    const { userId } = (req as any).user;
    try {
			const notifications=await NotificationService.getAllNotification(userId);
      return res.status(200).json(
        ApiResponse.success(notifications, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
  }
	
	static async readNotification(req: Request, res: Response, next: NextFunction) {
		const {notificationId}=req.params;
    try {
			await NotificationService.readNotification(notificationId);
      return res.status(200).json(
        ApiResponse.success(null, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
  }

	static async readAllNotification(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    try {
			await NotificationService.readAllNotification(userId);
      return res.status(200).json(
        ApiResponse.success(null, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
  }

	static async getAllNotificationAdmin(req: Request, res: Response, next: NextFunction) {
		const { page, limit, offset } = (req as any).pagination;
    try {
			const notifications=await NotificationService.getAllNotificationsAdmin(page, limit, offset );
      return res.status(200).json(
        ApiResponse.success(notifications, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;