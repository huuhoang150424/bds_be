'use strict';

import { Request, Response, NextFunction } from 'express';
import {ChatService} from '@service';
import { ApiResponse, BadRequestError } from '@helper';

class ChatController {
	static async sendMessage(req: Request, res: Response, next: NextFunction) {
    const { content, receiverId } = req.body;
    const { userId } = (req as any).user;

    if (!content || !receiverId) {
			throw new BadRequestError('Nội dung tin nhắn và ID người nhận không được để trống');
    }
    try {
      const message = await ChatService.sendMessage(userId, receiverId, content);
      return res.status(201).json(
        ApiResponse.success(message, 'Tin nhắn đã được gửi thành công')
      );
    } catch (error) {
      next(error);
    }
  }

	static async getAllMessage(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
		const {receiverId}=req.params;
    try {
      const allMessages = await ChatService.getAllMessages(userId,receiverId);
      return res.status(200).json(
        ApiResponse.success(allMessages, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
	}


	static async getConversationList(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;

    try {
      const conversations = await ChatService.getConversationList(userId);
      return res.status(200).json(
        ApiResponse.success(conversations, 'Thành công')
      );
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;