'use-strict';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/genera-token';
import { NotFoundError, UnauthorizedError, transporter, CacheRepository } from '@helper';

class AuthService {
  static async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại', 404);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Mật khẩu không chính xác', 403);
    }

    const access_token = await generaAccessToken(user);
    const refresh_token = await generaRefreshToken(user);

    return { access_token, refresh_token, user };
  }

  static async register(fullname: string, email: string, password: string, confirmPassword: string) {
    const existsUser = await User.findOne({ where: { email } });
    if (existsUser) {
      throw new UnauthorizedError('Email đã được đăng ký', 403);
    }
    if (password !== confirmPassword) {
      throw new UnauthorizedError('Xác nhận mật khẩu không khớp', 403);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullname, email, password: hashedPassword });

    return user;
  }

  static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Không cấp lại được token', 403);
    }

    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY!, (err, decoded: any) => {
        if (err) {
          reject(new UnauthorizedError('Không cấp lại được token', 403));
        }
        const accessToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, process.env.ACCESS_TOKEN_KEY!, {
          expiresIn: '1d',
        });
        resolve({ message: 'Thành công', accessToken });
      });
    });
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại', 404);
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await CacheRepository.set(`mail-${email}`, otpCode, 300);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận tài khoản',
      html: `<h2>Xác nhận tài khoản của bạn</h2><p>Mã xác thực tài khoản của bạn là ${otpCode}</p>`,
    });

    return { message: 'Thành công', otpExpires: new Date(Date.now() + 5 * 60 * 1000) };
  }

  static async verifyCode(email: string, otpCode: string) {
    const otpCodeStore = await CacheRepository.get(`mail-${email}`);
    if (otpCode !== otpCodeStore) {
      throw new UnauthorizedError('Mã OTP không hợp lệ hoặc đã hết hạn', 400);
    }
    await CacheRepository.delete(`mail-${email}`);
    return { message: 'Xác thực thành công' };
  }

  static async changePassword(userId: number, oldPassword: string, newPassword: string, confirmPassword: string) {
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại', 404);
    }

    if (newPassword !== confirmPassword) {
      throw new UnauthorizedError('Xác nhận mật khẩu không chính xác', 403);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Mật khẩu cũ không chính xác', 403);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }
}

export default AuthService;
