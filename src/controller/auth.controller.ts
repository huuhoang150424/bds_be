'use-strict';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { User } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/genera-token';
import { NotFoundError, UnauthorizedError, TokenError, transporter, CacheRepository } from '@helper';

dotenv.config({ path: '.env.local' });

class AuthController {
  //[login]
  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {

			return res.status(200).json({ message: 'Đăng nhập thành công'});
    } catch (error) {
      next(error);
    }
  }

  //[register]
  static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { name, email, password, confirmPassword } = req.body;


      return res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
      next(error);
    }
  }

  //[logout]
  static async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  }

  //[refreshToken]
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {

    } catch (error) {
      next(error);
    }
  }

  //[forgotPassword]
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      return res.status(200).json({ message: 'thành công' });
    } catch (error) {
      next(error);
    }
  }

  //[verifyCode]
  static async verifyCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, otpCode } = req.body;

      return res.status(200).json({ message: 'Xác thực thành công' });
    } catch (error) {
      next(error);
    }
  }

  //[changePassword]
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user;


      return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
