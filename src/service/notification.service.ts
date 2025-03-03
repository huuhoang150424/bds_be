import { Notification } from '@models';
import { NotFoundError } from '@helper';
import { io } from '../index';
class NotificationService {
<<<<<<< HEAD
  static async createNotification(userId: string, message: string) {
    await Notification.create({
      message,
      userId
    })
  }
  static async readNotification(notificationId: string) {
    const notification = await Notification.findOne({ where: { id: notificationId } })
    if (!notification) {
=======
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
>>>>>>> 89ef71cb1a3c3b5e8aa4291f5e3548d148189ed8
      throw new NotFoundError('Thông báo không tồn tại');
    }
    notification.isRead = true;
    await notification.save();
  }
}


export default NotificationService;