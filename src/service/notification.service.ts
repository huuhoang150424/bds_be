import { Notification, User } from '@models';
import { BadRequestError, NotFoundError } from '@helper';
import { io } from '../index';
import { Op } from 'sequelize';
import { Roles } from '@models/enums';
import { NotificationData } from '@interface/user.interface';
import UserService from './user.service';
import redisClient from '@config/redis';


interface NotificationTask {
  taskId: string;
  message: string;
  priority: number;
  endDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

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
	static readonly BATCH_SIZE = 300;
  static readonly QUEUE_KEY = 'notification:queue';
  static readonly FAILED_QUEUE_KEY = 'notification:queue:failed';
  static readonly ONLINE_USERS_KEY = 'online:users';

  static async enqueueNotification(data: NotificationData): Promise<{ message: string; taskId: string }> {
    if (!redisClient.isReady) {
      throw new Error('Redis is not connected');
    }
    const taskId = `task:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const task: NotificationTask = {
      taskId,
      message: data.message,
      priority: data.priority || 1,
      endDate: new Date(data.endDate).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await redisClient.lPush(this.QUEUE_KEY, JSON.stringify(task));
    this.processNotificationQueue().catch((err) => {
      console.error(`[${new Date().toISOString()}] Error processing queue:`, err);
    });

    return { message: 'Notification task enqueued successfully', taskId };
  }

  static async processNotificationQueue() {
    while (redisClient.isReady) {
      const taskRaw = await redisClient.brPop(this.QUEUE_KEY, 10);
      if (!taskRaw) continue;
      const task: NotificationTask = JSON.parse(taskRaw.element);
      try {
        task.status = 'processing';
        await this.processNotificationTask(task);
        task.status = 'completed';
        console.log(`[${new Date().toISOString()}] Task completed:`, task.taskId);
      } catch (err: any) {
        console.error(`[${new Date().toISOString()}] Error processing task ${task.taskId}:`, err);
        task.status = 'failed';
        await redisClient.lPush(
          this.FAILED_QUEUE_KEY,
          JSON.stringify({ ...task, error: err.message })
        );
      }
    }
  }

  static async processNotificationTask(task: NotificationTask) {
    const { message, priority, endDate } = task;
    const endDateObj = new Date(endDate);
    if (endDateObj < new Date()) {
      console.log(`[${new Date().toISOString()}] Skipping expired task:`, task.taskId);
      return;
    }
    const userCount = await User.count();
    if (userCount === 0) {
      return;
    }
    for (let offset = 0; offset < userCount; offset += this.BATCH_SIZE) {
      const users = await User.findAll({
        attributes: ['id'],
        limit: this.BATCH_SIZE,
        offset,
      });

      const userIds = users.map((user) => user.id);
      await this.sendBatchNotifications(userIds, message, priority, endDateObj);
    }
  }

  static async sendBatchNotifications(userIds: string[], message: string, priority: number, endDate: Date) {
    if (!userIds.length) {
      return;
    }

    const notificationData = userIds.map((userId) => ({
      userId,
      message,
      priority,
      endDate,
      isRead: false,
    }));
    const createdNotifications = await Notification.bulkCreate(notificationData, {
      validate: true,
      individualHooks: false,
    });

    const onlineUsersRaw = await redisClient.hGetAll(this.ONLINE_USERS_KEY);
    const onlineUsers = new Set(Object.keys(onlineUsersRaw));
    createdNotifications.forEach((notification) => {
      if (onlineUsers.has(notification.userId)) {
        io.to(notification.userId).emit('newNotification', {
          id: notification.id,
          userId: notification.userId,
          message: notification.message,
          priority: notification.priority,
          endDate: notification.endDate,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
        console.log(`[${new Date().toISOString()}] Emitted notification to user:`, notification.userId);
      }
    });
  }

}

export default NotificationService;
