import express from 'express';
import { verifyRole } from '@middleware';
import { NotificationController } from '@controller';
import { Roles } from '@models/enums';

const Router = express.Router();

Router.get('/getAllNotification', verifyRole([Roles.User,Roles.Agent]), NotificationController.getAllNotification as any);


export default Router;
