'use-strict';

import { Request, Response, NextFunction } from 'express';
import { User } from '@models';
import { NotFoundError, UnauthorizedError, TokenError } from '@helper';
import UserService from '@service/user.service';


class UserController {
  //[getAllUser]
  static async getAllUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(200).json({ message: 'Danh sách người dùng' });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
