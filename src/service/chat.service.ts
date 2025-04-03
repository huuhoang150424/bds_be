import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import 'dotenv/config';
import Post from '@models/post.model';
import PropertyType from '@models/property-types.model';
import ListingType from '@models/listing-types.model';
import Image from '@models/image.model';

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
}

export default ChatService;