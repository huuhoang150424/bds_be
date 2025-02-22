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

	static async getUserById (userId:string) {
		const user=await User.findByPk(userId);
		if (!user) {
			throw new NotFoundError("Không tìm thấy người dùng",404);
		}
		return user;
	}

	static async updateUser (userId:string,data:any) {
		const user=await User.findByPk(userId);
		if (!user) {
			throw new NotFoundError("Không tìm thấy người dùng",404);
		}
		await user.update(data,{where: {userId:userId}});
		const updatedUser = await User.findOne({ where: { userId: userId } });
		return updatedUser;
	}

}


export default UserService;