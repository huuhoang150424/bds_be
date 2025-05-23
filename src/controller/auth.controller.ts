'use-strict';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from "@service";
import { ApiResponse } from "@helper";
import "dotenv/config";
class AuthController {
  //[login]
  static async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
      const { accessToken, refreshToken, user } = await AuthService.login(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json(
        ApiResponse.success(
          {
            accessToken,
            user,
          },
          'Đăng nhập thành công',
        ),
      );
    } catch (error) {
      next(error);
    }
  }
	//[login with google]
	static async googleLogin(req: Request, res: Response, next: NextFunction) {
		const { email, displayName, photoUrl } = req.body;
    try {
      const { accessToken, refreshToken, user } = await AuthService.googleLogin({
        email,
        displayName,
        photoUrl
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      return res.status(200).json(
        ApiResponse.success(
          {
            accessToken,
            user,
          },
          'Đăng nhập với Google thành công',
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  //[register]
  static async register(req: Request, res: Response, next: NextFunction) {
    const { fullname, email, password, confirmPassword } = req.body;
    try {
      await AuthService.register(fullname, email, password, confirmPassword);
      return res.status(201).json(ApiResponse.success(null, 'Đăng ký thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[logout]
  static async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'lax' });
      return res.status(200).json(ApiResponse.success(null, 'Đăng xuất thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[refreshToken]
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.cookies;
    try {
      const data = await AuthService.refreshToken(refreshToken);
      return res.status(200).json(ApiResponse.success(data, 'Làm mới token thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[forgotPassword]
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    try {
      const data = await AuthService.forgotPassword(email);
      return res.status(200).json(ApiResponse.success(data, 'Gửi email đặt lại mật khẩu thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[verifyCode]
  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    const { email, otpCode } = req.body;
    try {
      const data = await AuthService.verifyCode(email, otpCode);
      return res.status(200).json(ApiResponse.success(data, 'Mã OTP hợp lệ'));
    } catch (error) {
      next(error);
    }
  }

  //[changePassword]
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    const { userId } = (req as any).user;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    try {
      const data = await AuthService.changePassword(userId, oldPassword, newPassword, confirmPassword);
      return res.status(200).json(ApiResponse.success(data, 'Đổi mật khẩu thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[verify account]
  static async verifyAccount(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    try {
      const data = await AuthService.verifyAccount(email);
      return res.status(200).json(ApiResponse.success(data, 'Tài khoản đã được xác minh'));
    } catch (error) {
      next(error);
    }
  }
  //[verify email]
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { token, email } = req.query;
    try {
      const data = await AuthService.verifyEmail(token as string, email as string);
      return res.status(200).json(ApiResponse.success(data, 'Xác minh email thành công'));
    } catch (error) {
      next(error);
    }
  }

  //[reset password]
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { email, newPassword, resetToken } = req.body;
    try {
      const data = await AuthService.resetPassword(email, newPassword, resetToken);
      return res.status(200).json(ApiResponse.success(data, 'Đổi mật khẩu thành công'));
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
