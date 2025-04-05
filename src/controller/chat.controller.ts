'use strict';

import { Request, Response, NextFunction } from 'express';
import {ChatService} from '@service';
import { ApiResponse, BadRequestError } from '@helper';

class ChatController {


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