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
import { sequelize } from '@config/database';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
interface PostConditions {
  price?: { lte?: number; gte?: number };
  bedroom?: number;
  bathroom?: number;
  squareMeters?: number;
  floor?: number;
  isFurniture?: boolean;
  direction?: string;
  status?: string;
  address?: string;
}

// Define return type for clarity
interface PostResponse {
  posts: any[];
  advice: string;
}

class ChatService {
  //handle chat bot
  static async parseUserRequest(message: string): Promise<any> {
    const prompt = `
    Bạn là một trợ lý bất động sản thông minh, chuyên tư vấn linh động và phân loại yêu cầu người dùng. Phân tích yêu cầu sau và trả về một object JSON chứa:
    - "type": Loại yêu cầu, là "search" (tìm kiếm bất động sản, ví dụ: yêu cầu danh sách nhà) hoặc "consulting" (tư vấn mua nhà, ví dụ: hỏi cách mua nhà).
    - "conditions": Điều kiện truy vấn cho cơ sở dữ liệu (price, bedroom, bathroom, squareMeters, floor, isFurniture, direction, status, address). Nếu là tư vấn, conditions có thể chỉ chứa price hoặc rỗng.
    - "advice": Gợi ý tư vấn ngắn gọn cho tìm kiếm (ví dụ: khu vực phù hợp, mẹo mua nhà) hoặc chi tiết cho tư vấn (loại bất động sản, khu vực, phong thủy, mẹo).
    Giá tiền tính bằng VND (7 tỷ = 7000000000). Nếu yêu cầu không liên quan đến bất động sản, trả về { "type": "none", "conditions": {}, "advice": "Yêu cầu không liên quan đến bất động sản." }.
    Yêu cầu: "${message}"
    Ví dụ:
    - "cho tôi danh sách nhà dưới 7 tỷ" -> {
        "type": "search",
        "conditions": { "price": { "lte": 7000000000 } },
        "advice": "Nhà dưới 7 tỷ phù hợp ở Hoàng Mai, Long Biên. Kiểm tra pháp lý kỹ."
      }
    - "Tôi có 5 tỷ không biết mua nhà như thế nào đây" -> {
        "type": "consulting",
        "conditions": { "price": { "lte": 5000000000 } },
        "advice": "Với 5 tỷ, bạn có thể mua căn hộ chung cư 2-3 phòng ngủ ở Hoàng Mai, Hà Đông, hoặc nhà phố nhỏ ở ngoại thành Hà Nội. Ưu tiên nhà có nội thất để tiết kiệm chi phí. Kiểm tra pháp lý kỹ và thương lượng giá."
      }
    - "Tôi muốn ăn pizza" -> { "type": "none", "conditions": {}, "advice": "Yêu cầu không liên quan đến bất động sản." }
  `;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json|```/g, '').trim();
      console.log('Cleaned Gemini response:', responseText);
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return { type: 'none', conditions: {}, advice: 'Đã xảy ra lỗi khi phân tích yêu cầu. Vui lòng thử lại.' };
    }
  }
  static async generateFlexibleAdvice(conditions: any, type: string): Promise<string> {
    try {
      const avgPrice = await Post.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('price')), 'avgPrice']],
        where: { status: 'Còn trống' },
      });
      const avgPriceValue: any = avgPrice?.get('avgPrice') || 0;

      const countPosts = type === 'search' ? await Post.count({ where: conditions }) : 0;
      const priceCondition = conditions.price?.lte || conditions.price?.gte || Number.MAX_SAFE_INTEGER;

      let advice = '';

      if (priceCondition) {
        if (priceCondition < avgPriceValue * 0.7) {
          advice += `Ngân sách ${priceCondition / 1000000000} tỷ thấp hơn giá trung bình (${(avgPriceValue / 1000000000).toFixed(2)} tỷ). Bạn có thể tìm căn hộ 1-2 phòng ngủ ở Hoàng Mai, Hà Đông, hoặc nhà phố nhỏ ngoại thành. `;
        } else if (priceCondition > avgPriceValue * 1.3) {
          advice += `Ngân sách ${priceCondition / 1000000000} tỷ cho phép mua căn hộ cao cấp ở Cầu Giấy, Nam Từ Liêm, hoặc nhà phố trung tâm. `;
        } else {
          advice += `Ngân sách ${priceCondition / 1000000000} tỷ phù hợp với căn hộ 2-3 phòng ngủ hoặc nhà phố nhỏ ở Long Biên, Gia Lâm. `;
        }
      }

      if (type === 'search') {
        if (countPosts === 0) {
          advice += 'Không tìm thấy bài đăng phù hợp. Hãy tăng ngân sách hoặc tìm ở khu vực ngoại thành. ';
        } else {
          advice += `Tìm thấy ${countPosts} bài đăng phù hợp. Kiểm tra pháp lý kỹ. `;
        }
      } else if (type === 'consulting') {
        advice +=
          'Bạn nên chọn căn hộ chung cư nếu muốn tiện ích hiện đại, hoặc nhà phố nếu cần không gian riêng. Xác định khu vực ưu tiên và kiểm tra pháp lý kỹ. ';
      }

      if (conditions.direction) {
        const directionMap: { [key: string]: string } = {
          Đông: 'hợp mệnh Mộc, mang năng lượng tích cực.',
          'Đông Nam': 'hợp mệnh Mộc, tốt cho tài lộc.',
          Nam: 'hợp mệnh Hỏa, mang sự ấm áp.',
          Tây: 'hợp mệnh Kim, tốt cho sự ổn định.',
        };
        advice += `Hướng ${conditions.direction} ${directionMap[conditions.direction] || 'phù hợp với nhiều gia chủ.'} `;
      }

      advice += 'Mẹo: Kiểm tra pháp lý rõ ràng, thương lượng giá hợp lý, ưu tiên nhà có nội thất.';

      return advice.trim();
    } catch (error) {
      console.error('Error generating flexible advice:', error);
      return 'Không thể tạo gợi ý do lỗi hệ thống. Vui lòng thử lại.';
    }
  }
  static async getPostsByConditions(conditions: any, type: string, userMessage: string): Promise<any> {
    let posts: any[] = [];
    let advice = '';

    const whereClause: any = {};

    if (conditions.price?.lte || conditions.price?.gte) {
      whereClause.price = {};
      if (conditions.price.lte) whereClause.price[Op.lte] = conditions.price.lte;
      if (conditions.price.gte) whereClause.price[Op.gte] = conditions.price.gte;
    }
    if (conditions.bedroom !== undefined && conditions.bedroom !== null) whereClause.bedroom = conditions.bedroom;
    if (conditions.bathroom !== undefined && conditions.bathroom !== null) whereClause.bathroom = conditions.bathroom;
    if (conditions.squareMeters !== undefined && conditions.squareMeters !== null)
      whereClause.squareMeters = conditions.squareMeters;
    if (conditions.floor !== undefined && conditions.floor !== null) whereClause.floor = conditions.floor;
    if (conditions.isFurniture !== undefined && conditions.isFurniture !== null)
      whereClause.isFurniture = conditions.isFurniture;
    if (conditions.direction !== undefined && conditions.direction !== null)
      whereClause.direction = conditions.direction;
    if (conditions.status !== undefined && conditions.status !== null) whereClause.status = conditions.status;
    if (conditions.address) {
      whereClause.address = { [Op.iLike]: `%${conditions.address}%` };
    }

    if (type === 'search') {
      posts = await Post.findAll({
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
          'slug',
        ],
        limit: 5,
      });
    }

    advice = await this.generateFlexibleAdvice(conditions, type);

    return { posts, advice };
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
        senderId: userId,
        receiverId,
        content,
        isRead: false,
      });

      const populatedMessage = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'avatar', 'fullname'] },
          { model: User, as: 'receiver', attributes: ['id', 'avatar', 'fullname'] },
        ],
      });

      io.to(userId).emit('newMessageChat', populatedMessage);
      io.to(receiverId).emit('newMessageChat', populatedMessage);
      console.log('Gửi');
      return populatedMessage;
    } catch (error: any) {
      throw new Error(`Lỗi khi gửi tin nhắn: ${error.message}`);
    }
  }

  static async getAllMessages(userId: string, receiverId: string) {
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
        limit: 30,
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
            avatar: otherUser.avatar,
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
