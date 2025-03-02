import { Notification } from '@models';
import { NotFoundError } from '@helper';
import { io } from '@socket';
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
}


export default NotificationService;