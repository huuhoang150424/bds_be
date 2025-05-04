'use-strict';

import { Request, Response, NextFunction } from 'express';
import UserService from '@service/user.service';
import { ApiResponse, BadRequestError } from '@helper';

class UserController {
  //[getAllUser]
  static async getAllUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { page, limit } = (req as any).pagination;
    try {
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
  static async getUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = req.params;
		const {type}=req.query;
    try {
      const findUser = type==='profile'?await UserService.getUserProfile(userId):await UserService.getUserById(userId);
      return res.status(200).json(ApiResponse.success(findUser, 'Thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[updateUser]

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    const { userId } = req.params;
    const data = req.body;
    const files = (req as any).files; 
    const { removedAvatarUrl, removedCoverPhotoUrl,removedCertificateUrl } = req.body; 

    try {
      const updatedUser = await UserService.updateUser(
        userId,
        data,
        files,
        user,
        removedAvatarUrl,
        removedCoverPhotoUrl,
        removedCertificateUrl
      );
      return res.status(200).json(ApiResponse.success(updatedUser, 'Cập nhật thông tin thành công'));
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserLock(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = req.params;
    const { action } = req.query;
    try {
      const upperAction = (action as string)?.toUpperCase();
      if (!['LOCK', 'UNLOCK'].includes(upperAction)) {
        throw new BadRequestError('Chỉ chấp nhận LOCK hoặc UNLOCK');
      }
      await UserService.toggleLockUser(userId, upperAction);
      const message = upperAction === 'UNLOCK' ? 'Mở khóa thành công' : 'Khóa người dùng thành công';
      return res.status(200).json(ApiResponse.success(null, message));
    } catch (error) {
      next(error);
    }
  }

  static async updatePhone(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { userId } = (req as any).user;
    const { phone } = req.body;
    try {
      const result =await UserService.updatePhone(userId, phone);
      return res.status(200).json(ApiResponse.success(result, 'cập nhất số điện thoại thành công'));
    } catch (error) {
      next(error);
    }
  }


	static async registerAsBroker(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
		const { userId } = (req as any).user;
		const data=req.body;
		const certificates = req.file?.path;
    if (certificates) {
      data.certificates = certificates;
    }
		try {
			const result = await UserService.registerAsBroker(userId,data);
			return res.status(200).json(ApiResponse.success(result, 'Đăng ký môi giới thành công'));
		} catch (error) {
			next(error);
		}
	}
	
}
export default UserController;
