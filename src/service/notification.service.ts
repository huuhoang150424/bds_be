import { Notification } from '@models';
import { NotFoundError } from '@helper';
import { io } from '../index';
import { Op } from 'sequelize';
class NotificationService {
	static async createNotification(userId:string,message:string){
		const newNotification=await Notification.create({
			message,
			userId
		});
		io.to(userId).emit("newNotification", {
      message,
      createdAt: newNotification.createdAt,
    });
		return newNotification;
	}
	static async readNotification(notificationId:string){
		const notification=await Notification.findOne({where: {id:notificationId}})
		if (!notification) {
      throw new NotFoundError('Thông báo không tồn tại');
		}
		notification.isRead=true;
		await notification.save();
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


}


export default NotificationService;