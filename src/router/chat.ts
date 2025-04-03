import express from 'express';
import { verifyRole } from '@middleware';
import { ChatController } from '@controller';

const Router = express.Router();

Router.post('/send', verifyRole(['User']), ChatController.sendMessage as any);


export default Router;
