import { Notification, User } from '@models';
import { BadRequestError, NotFoundError } from '@helper';
import { io } from '../index';
import { Op } from 'sequelize';
import { Roles } from '@models/enums';
import { NotificationData } from '@interface/user.interface';
import UserService from './user.service';
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

  static async sendNotification(data: NotificationData) {
    const { message, priority = 1, endDate, userId } = data;
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      throw new BadRequestError('Invalid endDate');
    }

    const notifications: Notification[] = [];

    if (userId) {
      const userIds = Array.isArray(userId) ? userId : [userId];

      const users = await User.findAll({
        where: {
          id: userIds,
        },
      });

      if (!users.length) {
        throw new BadRequestError('No matching users found');
      }

      const notificationData = users.map((user) => ({
        userId: user.id,
        message,
        priority,
        endDate: endDateObj,
        isRead: false,
      }));

      const createdNotifications = await Notification.bulkCreate(notificationData);
      notifications.push(...createdNotifications);

      createdNotifications.forEach((notification) => {
        io.to(notification.userId).emit('newNotification', notification);
      });
    } else {
      const users = await User.findAll();
      if (!users.length) {
        throw new BadRequestError('No users found to send notifications');
      }

      const notificationData = users.map((user) => ({
        userId: user.id,
        message,
        priority,
        endDate: endDateObj,
        isRead: false,
      }));

      const createdNotifications = await Notification.bulkCreate(notificationData);
      notifications.push(...createdNotifications);

      createdNotifications.forEach((notification) => {
        io.to(notification.userId).emit('newNotification', notification);
      });
    }

    return { message: 'Gửi thông báo thành công' };
  }

  static async getNotificationById(notificationId: string) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }

  static async deleteNotification(notificationId: string) {
    const notification = await this.getNotificationById(notificationId);

    await notification.destroy();
    return { message: 'Xóa thông báo thành công' };
  }
}

export default NotificationService;
