import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@models';
import { generaAccessToken, generaRefreshToken } from '@helper/general-token';
import { NotFoundError, UnauthorizedError, transporter, CacheRepository, TokenError,BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import "dotenv/config";
import { Gender, Roles } from '@models/enums';



class AuthService {
  static async login(email: string, password: string) {
		const loginAttemptKey=`login_attempt:${email}`;
		const lockKey=`login_lock:${email}`;

		const isLocked=await CacheRepository.get(lockKey);
		if (isLocked) {
			throw new BadRequestError('Bạn đã nhập sai quá 10 lần, vui lòng thử lại sau 5 phút')
		}
		const attempt=await CacheRepository.get(loginAttemptKey);
		const failedAttempt = attempt ? parseInt(attempt) : 0;

		const user = await User.findOne({
			where: { email },
			attributes: ["id", "fullname", "email", "phone", "avatar", "balance", "score", "password","roles","emailVerified"],
		});
		
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
			await CacheRepository.set(loginAttemptKey,failedAttempt+1,300);
			if (failedAttempt+1>=10) {
				await CacheRepository.set(lockKey,'locked',300);
			}
      throw new UnauthorizedError('Mật khẩu không chính xác');
    }

		delete (user as any).password;
		await CacheRepository.delete(loginAttemptKey);

    const accessToken = await generaAccessToken(user);
    const refreshToken = await generaRefreshToken(user);
    return { accessToken, refreshToken, user };
  }

	static async googleLogin(googleData: { email: string, displayName: string, photoUrl: string }) {
    try {
      let user = await User.findOne({
        where: { email: googleData.email },
        attributes: ["id", "fullname", "email", "phone", "avatar", "balance", "score", "roles", "emailVerified"],
      });
      if (!user) {
        
        user = await User.create({
          email: googleData.email,
          fullname: googleData.displayName || 'User',
          password:  Math.random().toString(36).slice(2, 12),
          avatar: googleData.photoUrl || "https://img.freepik.com/premium-vector/user-icons-includes-user-icons-people-icons-symbols-premiumquality-graphic-design-elements_981536-526.jpg",
          emailVerified: true,
          roles: Roles.User,
          gender: Gender.Other,
          active: true
        }, {
          hooks: false
        });
      } else {
        const needsUpdate = (
          (googleData.displayName && googleData.displayName !== user.fullname) ||
          (googleData.photoUrl && googleData.photoUrl !== user.avatar) ||
          (user.emailVerified === false)
        );
        
        if (needsUpdate) {
          await user.update({
            fullname: googleData.displayName || user.fullname,
            avatar: googleData.photoUrl || user.avatar,
            emailVerified: true
          });
        }
      }
      await User.update(
        { lastActive: new Date() },
        { where: { id: user.id }, hooks: false }
      );
      const accessToken = await generaAccessToken(user);
      const refreshToken = await generaRefreshToken(user);

      return { accessToken, refreshToken, user };
    } catch (error:any) {
      throw new BadRequestError('Đăng nhập với Google thất bại: ' + (error.message));
    }
  }

  static async register(fullname: string, email: string, password: string, confirmPassword: string) {
    const existsUser = await User.findOne({ where: { email } });
    if (existsUser) {
      throw new UnauthorizedError('Email đã được đăng ký');
    }
    if (password !== confirmPassword) {
      throw new UnauthorizedError('Xác nhận mật khẩu không khớp');
    }
    const user = await User.create({ fullname, email, password });
    return user;
  }

	static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Không cấp lại được token');
    }
    
    return new Promise((resolve, reject) => {
      const refreshKey = process.env.REFRESH_TOKEN_KEY;
      
      if (!refreshKey) {
        return reject(new UnauthorizedError('Không tìm thấy REFRESH_TOKEN_KEY'));
      }
      
      jwt.verify(refreshToken, refreshKey, async (err, decoded: any) => {
        if (err) {
          return reject(new UnauthorizedError('Không cấp lại được token'));
        }
        try {
          const user = {
            id: decoded.userId,
            roles: decoded.role
          };
          const accessToken = await generaAccessToken(user);
          resolve({ message: 'Thành công', accessToken });
        } catch (error) {
          reject(new UnauthorizedError('Lỗi khi tạo access token mới'));
        }
      });
    });
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
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
    if (!otpCodeStore || JSON.parse(otpCodeStore) !==otpCode ) {
      throw new UnauthorizedError('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
		const resetToken = uuidv4();
		await CacheRepository.set(`resetToken-${email}`, resetToken, 300);
    await CacheRepository.delete(`mail-${email}`);
    return { message: 'Xác thực thành công',resetToken };
  }

	static async resetPassword(email: string, newPassword: string, resetToken: string) {
    const storedToken = await CacheRepository.get(`resetToken-${email}`);
    if (!storedToken || JSON.parse(storedToken)  !== resetToken) {
      throw new BadRequestError('Token không hợp lệ hoặc đã hết hạn');
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    await CacheRepository.delete(`resetToken-${email}`);
    return { message: 'Đổi mật khẩu thành công' };
  }


  static async changePassword(userId: number, oldPassword: string, newPassword: string, confirmPassword: string) {
    const user = await User.findOne({ where: { id:userId } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    if (newPassword !== confirmPassword) {
      throw new UnauthorizedError('Xác nhận mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Mật khẩu cũ không chính xác');
    }
    user.password = newPassword;
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

	
  static async verifyAccount( email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }
    const verificationToken = uuidv4();
		const existingToken = await CacheRepository.get(`verify:${email}`);
    if (existingToken) {
      throw new BadRequestError('Email đã có một yêu cầu xác thực đang chờ xử lý.');
    }
    await CacheRepository.set(`verify:${email}`, verificationToken, 900);
		const verificationLink = `${process.env.FRONTEND_URL}?token=${verificationToken}&email=${email}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận tài khoản',
      html: `
        <h2>Xác nhận tài khoản của bạn</h2>
        <p>Nhấn vào liên kết bên dưới để xác thực email:</p>
        <a href="${verificationLink}">Xác nhận email</a>
        <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
      `,
    });

    return { message: 'Email xác thực đã được gửi' };
  }

	static async verifyEmail(token: string, email: string) {
    const storedToken = await CacheRepository.get(`verify:${email}`);

    if (!storedToken || JSON.parse(storedToken) !== token) {
      throw new TokenError('Token không hợp lệ hoặc đã hết hạn');
    }

    await CacheRepository.delete(`verify:${email}`);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    user.emailVerified = true;
    await user.save();

    return { message: 'Email đã được xác thực thành công' };
  }

}

export default AuthService;
