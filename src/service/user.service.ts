import { User } from '@models';
import { NotFoundError, UnauthorizedError, TokenError } from '@helper';

class UserService {

	static async getAllUser (page : number,limit: number) {
		const offset=(page-1)*limit;
		const {rows,count}=await User.findAndCountAll({
			limit: limit,
			offset: offset,
			order: [['createdAt', 'DESC']]
		})

		return {rows,count};
	}

	static async getUserById (userId:string,user:any) {
		if (user.userId!==userId) {
			throw new UnauthorizedError("Bạn không có quyền",403);
		}
		const findUser=await User.findByPk(userId);
		if (!findUser) {
			throw new NotFoundError("Không tìm thấy người dùng",404);
		}
		return findUser;
	}

	static async updateUser (userId:string,data:any,user:any) {
		if (user.userId!==userId) {
			throw new UnauthorizedError("Bạn không có quyền",403);
		}
		const findUser=await User.findByPk(userId);
		if (!findUser) {
			throw new NotFoundError("Không tìm thấy người dùng",404);
		}
		await findUser.update(data,{where: {userId:userId}});
		const updatedUser = await User.findOne({ where: { userId: userId } });
		return updatedUser;
	}

}


export default UserService;