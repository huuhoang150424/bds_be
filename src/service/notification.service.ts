import { Notification } from '@models';
import { NotFoundError } from '@helper';

class NotificationService {
	static async createNotification(userId:string,message:string){
		await Notification.create({
			message,
			userId
		})
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