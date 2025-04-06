import express from 'express';
import { verifyRole } from '@middleware';
import { ChatController } from '@controller';

const Router = express.Router();

Router.post('/send', verifyRole(['User','Agent']), ChatController.sendMessage as any);
Router.get('/getAllConversation', verifyRole(['User','Agent']), ChatController.getConversationList as any);
Router.get('/:receiverId/getAllMessage', verifyRole(['User','Agent']), ChatController.getAllMessage as any);
export default Router;
