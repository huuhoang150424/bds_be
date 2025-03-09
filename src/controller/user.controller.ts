'use-strict';

import { Request, Response, NextFunction } from 'express';
import UserService from '@service/user.service';
import { ApiResponse } from '@helper';

class UserController {
  //[getAllUser]
  static async getAllUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { rows, count } = await UserService.getAllUser(page, limit);

      return res.status(200).json(
        ApiResponse.success(
          {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: rows,
          },
          'Thành công',
        ),
      );
    } catch (error) {
      next(error);
    }
  }
  //[getUserById]
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const findUser = await UserService.getUserById(userId);
      return res.status(200).json(ApiResponse.success(findUser,"Thành công"));
    } catch (error) {
      next(error);
    }
  }

  //[updateUser]
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
			const user=(req as any).user;
      const userId = req.params.userId;
			const data=req.body;
			const avatar=req.file?.path;
			console.log(avatar)
			if (avatar) {
				data.avatar=avatar;
			}
			const updatedUser=await UserService.updateUser(userId,data,user);
      return res.status(200).json(ApiResponse.success(updatedUser,"Thành công"));
    } catch (error) {
      next(error);
    }
  }


  //[unLockUser]
  static async unLockUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
			
      return res.status(200).json(ApiResponse.success(null,"Mở khóa thành công"));
    } catch (error) {
      next(error);
    }
  }

}

export default UserController;
