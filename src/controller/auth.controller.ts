'use-strict';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { User, Role, UserRole } from '../models';
import { generaAccessToken, generaRefreshToken } from '../helper/genera-token';
import { NotFoundError, UnauthorizedError, TokenError, transporter, CacheRepository } from '../helper';

dotenv.config({ path: '.env.local' });

class AuthController {
  //[login]
  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, password, isMobile } = req.body;
      const user = await User.findOne({
        where: { email: email },
        include: [
          {
            model: UserRole,
            include: [
              {
                model: Role,
                attributes: ['roleName'],
              },
            ],
          },
        ],
      });
      if (!user) {
        throw new NotFoundError('Người dùng không tồn tại', 404);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Mật khẩu không chính xác', 403);
      }
      const access_token = await generaAccessToken(user);
      const refresh_token = await generaRefreshToken(user);
      if (!isMobile) {
        res.cookie('refreshToken', refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ message: 'Đăng nhập thành công', user, access_token });
      } else {
        return res.status(200).json({ message: 'Đăng nhập thành công', user, access_token, refresh_token });
      }
    } catch (error) {
      next(error);
    }
  }

  //[register]
  static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { name, email, password, confirmPassword } = req.body;

      const existsUser = await User.findOne({
        where: { email: email },
      });
      if (existsUser) {
        throw new UnauthorizedError('Email đã được đăng ký', 403);
      }

      if (password !== confirmPassword) {
        throw new UnauthorizedError('Xác nhận mật khẩu không khớp', 403);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
      });
      await user.save();
      const defaultRole = await Role.findOne({ where: { roleName: 'User' } });
      if (!defaultRole) {
        throw new UnauthorizedError('Quyền không tồn tại', 500);
      }

      await UserRole.create({
        userId: user.userId,
        roleId: defaultRole.roleId,
      });

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
      const refresh_token = req.body.refreshToken || req.cookies.refreshToken;
      if (!refresh_token) {
        throw new UnauthorizedError('không cấp lại được token', 403);
      }

      jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY!, (err: any, decoded: any) => {
        if (err) {
          throw new UnauthorizedError('không cấp lại được token', 403);
        }
        const accessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.ACCESS_TOKEN_KEY!, {
          expiresIn: '1d',
        });

        return res.status(200).json({ message: 'thành công', accessToken });
      });
    } catch (error) {
      next(error);
    }
  }

  //[forgotPassword]
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({
        where: { email: email },
      });
      if (!user) {
        throw new NotFoundError('Người dùng không tồn tại', 404);
      }

      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await CacheRepository.set(`mail-${email}`, otpCode, 300);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác nhận tài khoản',
        html: `
						<h2>Xác nhận tài khoản của bạn</h2>
						<p>Mã xác thực tài khoản của bạn là ${otpCode}</p>
					`,
      });
      return res.status(200).json({ message: 'thành công', otpExpires });
    } catch (error) {
      next(error);
    }
  }

  //[verifyCode]
  static async verifyCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, otpCode } = req.body;

      const otpCodeStore = await CacheRepository.get(`mail-${email}`);

      if (otpCode !== otpCodeStore) {
        throw new UnauthorizedError('Mã OTP không hợp lệ hoặc đã hết hạn', 400);
      }
      await CacheRepository.delete(`mail-${email}`);

      return res.status(200).json({ message: 'Xác thực thành công' });
    } catch (error) {
      next(error);
    }
  }

  //[changePassword]
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = (req as any).user;
      const findUser = await User.findOne({ where: { userId: user.userId } });

      if (!findUser) {
        throw new UnauthorizedError('Người dùng không tồn tại', 404);
      }

      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        throw new UnauthorizedError('Xác nhận mật khẩu không chính xác', 403);
      }

      const isMatch = await bcrypt.compare(oldPassword, findUser.password);
      if (!isMatch) {
        throw new UnauthorizedError('Mật khẩu cũ không chính xác', 403);
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      findUser.password = hashedPassword;
      await findUser.save();

      return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
