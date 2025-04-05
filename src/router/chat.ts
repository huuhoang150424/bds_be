import express from 'express';
import { verifyRole } from '@middleware';
import { ChatController } from '@controller';

const Router = express.Router();


Router.get('/getAllConversation', verifyRole(['User','Agent']), ChatController.getConversationList as any);

export default Router;
