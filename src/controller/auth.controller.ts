'use-strict';

import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { CacheRepository } from '@helper';
import {AuthService} from "@service";
import {ApiResponse} from "@helper";
dotenv.config({ path: '.env.local' });

class AuthController {
  //[login]
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { access_token, refresh_token,user } = await AuthService.login(email, password);

      res.cookie('refreshToken', refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json(
        ApiResponse.success(
          {
            access_token,
            user: {
              userId: user.userId,
              fullname: user.fullname,
              email: user.email,
              phone: user.phone,
              avatar: user.avatar,
              balance: user.balance,
              score: user.score,
            },
          },
          "Đăng nhập thành công"
        )
      );
			
    } catch (error) {
      next(error);
    }
  }

  //[register]
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullname, email, password, confirmPassword } = req.body;
      await AuthService.register(fullname, email, password, confirmPassword);
      return res.status(201).json(ApiResponse.success(null, "Đăng ký thành công"));
    } catch (error) {
      next(error);
    }
  }

  //[logout]
  static async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.status(200).json(ApiResponse.success(null, "Đăng xuất thành công"));
    } catch (error) {
      next(error);
    }
  }

  //[refreshToken]
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refresh_token = req.cookies.refreshToken;
			const data = await AuthService.refreshToken(refresh_token);
      return res.status(200).json(ApiResponse.success(data, "Làm mới token thành công"));
    } catch (error) {
      next(error);
    }
  }

  //[forgotPassword]
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const data = await AuthService.forgotPassword(email);
      return res.status(200).json(ApiResponse.success(data, "Gửi email đặt lại mật khẩu thành công"));
    } catch (error) {
      next(error);
    }
  }

  //[verifyCode]
  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otpCode } = req.body;
      const data = await AuthService.verifyCode(email, otpCode);
      return res.status(200).json(ApiResponse.success(data, "Mã OTP hợp lệ"));
    } catch (error) {
      next(error);
    }
  }

  //[changePassword]
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const data = await AuthService.changePassword(user.userId, oldPassword, newPassword, confirmPassword);
      return res.status(200).json(ApiResponse.success(data, "Đổi mật khẩu thành công"));
    } catch (error) {
      next(error);
    }
  }

	//[verify account]
  static async verifyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const data = await AuthService.verifyAccount(email);
      return res.status(200).json(ApiResponse.success(data, "Tài khoản đã được xác minh"));
    } catch (error) {
      next(error);
    }
  }
	//[verify email]
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, email } = req.query;
      const data = await AuthService.verifyEmail(token as string, email as string);
      return res.status(200).json(ApiResponse.success(data, "Xác minh email thành công"));
    } catch (error) {
      next(error);
    }
  }

}

export default AuthController;
