import { User } from '@models';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@helper';
import { Roles } from '@models/enums';

class UserService {
  static async getAllUser(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    return { rows, count };
  }

  static async getUserById(userId: string) {
    const findUser = await User.findByPk(userId);
    if (!findUser) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    return findUser;
  }

  static async updateUser(userId: string, data: any, user: any) {
    if (user.userId !== userId) {
      throw new UnauthorizedError('Bạn không có quyền');
    }
    const findUser = await this.getUserById(userId);
    await findUser.update(data, { where: { userId: userId } });
    const updatedUser = await User.findOne({ where: { userId: userId } });
    return updatedUser;
  }

  static async toggleLockUser(userId: string, type: string) {
    const findUser = await this.getUserById(userId);
    if (type === 'UNLOCK' && !findUser.isLock) {
      throw new BadRequestError('Người dùng này chưa bị khóa');
    }
    if (type === 'LOCK' && findUser.isLock) {
      throw new BadRequestError('Người dùng này đã bị khóa');
    }
    findUser.isLock = type === 'UNLOCK' ? false : true;
    await findUser.save();
    return findUser;
  }

  static async updatePhone(userId: string, phone: string) {
    const findUser = await this.getUserById(userId);

    const phoneStr = phone.toString();

    if (!/^\d{10}$/.test(phoneStr)) {
      throw new BadRequestError('Số điện thoại phải 10 số');
    }
    findUser.phone = phone;
    await findUser.save();
    return {newPhone:phone};
  }


	static async registerAsBroker(userId: string, data: any) {
		const findUser = await this.getUserById(userId);
		if (!findUser.emailVerified) {
			throw new BadRequestError('Bạn phải xác thực email trước');
		}

		if (findUser.roles === Roles.Agent) {
			throw new BadRequestError('Người dùng đã là môi giới bất động sản');
		}
		findUser.roles = Roles.Agent;
		findUser.address = data.address;
		findUser.selfIntroduction = data.selfIntroduction;
		findUser.experienceYears = data.experienceYears;
		if (data.certificates) {
			findUser.certificates = data.certificates;
		}
		if (data.fullname) {
			findUser.fullname = data.fullname;
		}
		if (data.phone) {
			findUser.phone = data.phone;
		}
		findUser.expertise = data.expertise || [];
		await findUser.save();
		return {
			roles: findUser.roles
		};
	}
	
}


export default UserService;