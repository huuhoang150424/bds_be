import express from 'express';
import { verifyRole } from '@middleware';
import { ChatController } from '@controller';
import { Roles } from '@models/enums';

const Router = express.Router();

Router.post('/send', verifyRole([Roles.User,Roles.Agent]), ChatController.sendMessage as any);
Router.get('/getAllConversation', verifyRole([Roles.User,Roles.Agent]), ChatController.getConversationList as any);
Router.get('/:receiverId/getAllMessage', verifyRole([Roles.User,Roles.Agent]), ChatController.getAllMessage as any);
export default Router;
