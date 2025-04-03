'use strict';

import { Request, Response, NextFunction } from 'express';
import {ChatService} from '@service';
import { ApiResponse } from '@helper';

class ChatController {
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json(ApiResponse.error('Nội dung tin nhắn không được để trống'));
    }
    try {

    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;