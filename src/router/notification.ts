import express from 'express';
import { verifyRole } from '@middleware';
import { NotificationController } from '@controller';
import { Roles } from '@models/enums';

const Router = express.Router();
//readNotification
Router.get('/getAllNotification', verifyRole([Roles.User,Roles.Agent]), NotificationController.getAllNotification as any);
Router.patch('/:notificationId/readNotification', verifyRole([Roles.User,Roles.Agent]), NotificationController.readNotification as any);
Router.patch('/readAllNotification', verifyRole([Roles.User,Roles.Agent]), NotificationController.readAllNotification as any);

export default Router;
