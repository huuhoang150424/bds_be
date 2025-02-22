'use-strict';

import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import {AuthService} from "@service";

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

			return res.status(200).json({
				message: 'Đăng nhập thành công',
				access_token,
				user: {
					userId: user.userId,
					fullname: user.fullname,
					email: user.email,
					phone: user.phone,
					avatar: user.avatar,
					balance: user.balance,
					score: user.score
				}
			});
			
    } catch (error) {
      next(error);
    }
  }

  //[register]
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullname, email, password, confirmPassword } = req.body;
      await AuthService.register(fullname, email, password, confirmPassword);
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
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refresh_token = req.cookies.refreshToken;
      return res.status(200).json(await AuthService.refreshToken(refresh_token));
    } catch (error) {
      next(error);
    }
  }

  //[forgotPassword]
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      return res.status(200).json(await AuthService.forgotPassword(email));
    } catch (error) {
      next(error);
    }
  }

  //[verifyCode]
  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otpCode } = req.body;
      return res.status(200).json(await AuthService.verifyCode(email, otpCode));
    } catch (error) {
      next(error);
    }
  }

  //[changePassword]
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      return res.status(200).json(await AuthService.changePassword(user.userId, oldPassword, newPassword, confirmPassword));
    } catch (error) {
      next(error);
    }
  }

	//[verify account]
  static async verifyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const response = await AuthService.verifyAccount(email);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
	//[verify email]
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, email } = req.query;
      const response = await AuthService.verifyEmail(token as string, email as string);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

}

export default AuthController;
