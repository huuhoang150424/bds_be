import { Notification, User } from '@models';
import { BadRequestError, NotFoundError } from '@helper';
import { io } from '../index';
import { Op } from 'sequelize';
import { Roles } from '@models/enums';
class NotificationService {
  static async createNotification(userId: string, message: string) {
    const newNotification = await Notification.create({
      message,
      userId,
    });
    io.to(userId).emit('newNotification', newNotification);
    return newNotification;
  }
  static async readNotification(notificationId: string) {
    const notification = await Notification.findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundError('Thông báo không tồn tại');
    }
    notification.isRead = true;
    await notification.save();
  }
  //readAllNotification
  static async readAllNotification(userId: string) {
    await Notification.update(
      { isRead: true },
      {
        where: { userId },
      },
    );
  }

  static async getAllNotification(userId: string) {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    const notifications = await Notification.findAll({
      where: {
        userId,
        createdAt: {
          [Op.gte]: fortyDaysAgo,
        },
      },
      order: [['createdAt', 'DESC']],
    });

    return notifications;
  }

  static async getAllNotificationsAdmin(page: number, limit: number, offset: number) {
    const { rows, count } = await Notification.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }
}

export default NotificationService;
