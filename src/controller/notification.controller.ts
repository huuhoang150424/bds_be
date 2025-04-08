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


}

export default NotificationController;