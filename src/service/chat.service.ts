import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import 'dotenv/config';
import Post from '@models/post.model';
import PropertyType from '@models/property-types.model';
import ListingType from '@models/listing-types.model';
import Image from '@models/image.model';
import Message from '@models/message.model';
import User from '@models/user.model';
import { io } from 'index';
import { NotFoundError } from '@helper/index';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

class ChatService {
	static async parseUserRequest(message: string): Promise<any> {
		const prompt = `
			Bạn là một trợ lý bất động sản. Phân tích yêu cầu sau từ người dùng và trả về một object JSON chứa các điều kiện truy vấn (query conditions) cho cơ sở dữ liệu. 
			Các trường có thể bao gồm: price (giá), bedroom (phòng ngủ), bathroom (phòng tắm), squareMeters (diện tích), floor (tầng), isFurniture (nội thất), direction (hướng), status (trạng thái). 
			Nếu không rõ hoặc yêu cầu không liên quan đến bất động sản, trả về object rỗng {}. Giá tiền tính bằng VND (ví dụ: 2 tỷ = 2000000000).
			Yêu cầu: "${message}"
			Ví dụ: 
			- "Tìm nhà dưới 2 tỷ, có 3 phòng ngủ" -> { "price": { "lte": 2000000000 }, "bedroom": 3 }
			- "Hello world" -> {}
			- "Tôi muốn ăn pizza" -> {}
		`;
	
		try {
			const result = await model.generateContent(prompt);
			let responseText = result.response.text();
			responseText = responseText.replace(/```json|```/g, '').trim();
			console.log('Cleaned Gemini response:', responseText);
			return JSON.parse(responseText);
		} catch (error) {
			console.error('Error parsing Gemini response:', error);
			return {};
		}
	}

  static async getPostsByConditions(conditions: any): Promise<any> {
    const whereClause: any = {};

    if (conditions.price?.lte || conditions.price?.gte) {
      whereClause.price = {};
      if (conditions.price.lte) whereClause.price[Op.lte] = conditions.price.lte;
      if (conditions.price.gte) whereClause.price[Op.gte] = conditions.price.gte;
    }
    if (conditions.bedroom !== undefined && conditions.bedroom !== null) whereClause.bedroom = conditions.bedroom;
    if (conditions.bathroom !== undefined && conditions.bathroom !== null) whereClause.bathroom = conditions.bathroom;
    if (conditions.squareMeters !== undefined && conditions.squareMeters !== null) whereClause.squareMeters = conditions.squareMeters;
    if (conditions.floor !== undefined && conditions.floor !== null) whereClause.floor = conditions.floor;
    if (conditions.isFurniture !== undefined && conditions.isFurniture !== null) whereClause.isFurniture = conditions.isFurniture;
    if (conditions.direction !== undefined && conditions.direction !== null) whereClause.direction = conditions.direction;
    if (conditions.status !== undefined && conditions.status !== null) whereClause.status = conditions.status;

    const posts = await Post.findAll({
      where: whereClause,
      include: [
        {
          model: Image,
          as: 'images', 
          attributes: ['imageUrl'],
        },
        {
          model: PropertyType,
          as: 'propertyType', 
          attributes: ['id', 'name'],
          include: [
            {
              model: ListingType,
              as: 'listingType', 
              attributes: ['id', 'listingType'],
            },
          ],
        },
      ],
      attributes: [
        'id',
        'title',
        'price',
        'priceUnit',
        'bedroom',
        'bathroom',
        'squareMeters',
        'floor',
        'isFurniture',
        'direction',
        'status',
				'address',
				'createdAt',
				'slug'
      ],
      limit: 5, 
    });
    return posts;
  }


	static async sendMessage(userId: string, receiverId: string, content: string) {
		try {
	
			const sender = await User.findByPk(userId);
			const receiver = await User.findByPk(receiverId);
	
	
			if (!sender) {
				throw new Error('Người gửi không tồn tại');
			}
			if (!receiver) {
				throw new Error('Người nhận không tồn tại');
			}
	
			const message = await Message.create({
				senderId:userId,
				receiverId,
				content,
				isRead: false,
			});
	
			const populatedMessage = await Message.findByPk(message.id, {
				include: [
					{ model: User, as: 'sender',attributes:['id','avatar','fullname'] },
					{ model: User, as: 'receiver',attributes:['id','avatar','fullname'] },
				],
			});
	
			io.to(userId).emit('newMessageChat', populatedMessage);
			io.to(receiverId).emit('newMessageChat', populatedMessage);
			console.log("Gửi")
			return populatedMessage;
		} catch (error: any) {
			throw new Error(`Lỗi khi gửi tin nhắn: ${error.message}`);
		}
	}

	static async getAllMessages(userId: string,receiverId:string) {
    try {
      const messages = await Message.findAll({
        where: {
					[Op.or]: [
						{ senderId: userId, receiverId: receiverId },
						{ senderId: receiverId, receiverId: userId }, 
					],
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fullname', 'avatar'] },
          { model: User, as: 'receiver', attributes: ['id', 'fullname', 'avatar'] },
        ],
        order: [['createdAt', 'DESC']],
				limit: 30
      });
      return messages;
    } catch (error: any) {
      throw new Error(`Lỗi : ${error.message}`);
    }
  }


	static async getConversationList(userId: string) {
		try {
			const messages = await Message.findAll({
				where: {
					[Op.or]: [{ senderId: userId }, { receiverId: userId }],
				},
				include: [
					{ model: User, as: 'sender', attributes: ['id', 'fullname', 'avatar'] },
					{ model: User, as: 'receiver', attributes: ['id', 'fullname', 'avatar'] },
				],
				order: [['createdAt', 'DESC']],
			});
			
			const userMap = new Map<string, any>();
			
			messages.forEach((message) => {
				const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
				const otherUser = message.senderId === userId ? message.receiver : message.sender;
				
				if (!userMap.has(otherUserId)) {
					userMap.set(otherUserId, {
						id: otherUser.id,
						fullname: otherUser.fullname,
						avatar: otherUser.avatar
					});
				}
			});
			return Array.from(userMap.values());
			
		} catch (error: any) {
			throw new Error(`Lỗi khi lấy danh sách người dùng chat: ${error.message}`);
		}
	}


}

export default ChatService;