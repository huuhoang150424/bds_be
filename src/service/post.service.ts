import { User, Post, PostHistory, Tag, TagPost, Image, ListingType, PropertyType,UserPricing,Pricing  } from '@models';
import { NotFoundError, UnauthorizedError, TokenError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import { CacheRepository } from '@helper';
import { Op } from 'sequelize';

class PostService {
  static async createPost(data: any, images: string[], userId: string) {
		//check pricing
		let userPricing = await UserPricing.findOne({
			where: { userId },
			include: [{ model: Pricing }],
			order: [['endDate', 'DESC']],
		});
		if (!userPricing) {
			userPricing = await UserPricing.create({
				userId,
				pricingId: null,
				remainingPosts: 15,
				displayDays: 10, 
				startDate: new Date(),
				endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), 
				boostDays: 0,
				hasReport: false,
				discountPercent: 0,
			});
		}
		const pricing = userPricing.pricing;
		//check count post 
		if (!pricing || pricing.name === 'VIP_1') {
			if (userPricing.remainingPosts <= 0) {
				throw new BadRequestError(
					`Bạn đã đạt giới hạn ${userPricing.remainingPosts} bài đăng trong tháng. Hãy nâng cấp gói thành viên!`
				);
			}
		}
		const displayDays = pricing ? pricing.displayDay : 10;
    const listingType = await ListingType.findOne({
      where: { id: data.listingType },
    });
    if (!listingType) {
      throw new BadRequestError('Loại tin đăng không hợp lệ');
    }
    const existsPost = await Post.findOne({
      where: { title: data.title },
    });
    if (existsPost) {
      throw new BadRequestError('Bài đăng đã tồn tại');
    }
    const priceUnit = listingType.listingType === 'Bán' ? 'VND' : 'VND/tháng';
    const expiredDate = displayDays === -1 ? null : new Date(Date.now() + displayDays * 24 * 60 * 60 * 1000);
    const newPost = await Post.create({
      userId: userId,
      id: uuidv4(),
      title: data.title,
      address: data.address,
      square_meters: data.square_meters,
      description: data.description,
      floor: data.floor,
      bedroom: data.bedroom,
      bathroom: data.bathroom,
      isFurniture: data.isFurniture,
      direction: data.direction,
      status: data.status,
      priceUnit: priceUnit,
      price: data.price,
			expiredDate: expiredDate
    });
    const propertyType = await PropertyType.findOne({
      where: { name: data.propertyType },
    });
    if (!propertyType) {
      await PropertyType.findOrCreate({
        where: { name: data.propertyType },
        defaults: {
          id: uuidv4(),
          name: data.propertyType,
          postId: newPost.id,
          listingTypeId: listingType.id,
        },
      });
    }
    await Promise.all(
      images.map(async (image) => {
        await Image.create({
          id: uuidv4(),
          imageUrl: image,
          postId: newPost.id,
        });
      }),
    );
    await Promise.all(
      data.tags.map(async (tag: string) => {
        const newTag = await Tag.create({
          id: uuidv4(),
          tagName: tag,
        });
        await TagPost.create({
          tagId: newTag.id,
          postId: newPost.id,
        });
      }),
    );
		if (!pricing || pricing.name === 'VIP_1') {
			userPricing.remainingPosts -= 1;
			await userPricing.save();
		}
    return newPost;
  }

  static async getPost(slug: string) {
		const cachePost=await CacheRepository.get(`post:${slug}`);
		if (cachePost) return cachePost;
    const post = await Post.findOne({
      where: { slug },
      include: [
        {
          model: User,
          attributes: ['id', 'fullname', 'email', 'phone', 'avatar'],
        },
        {
          model: Image,
          attributes: [],
        },
        {
          model: TagPost,
          attributes: ['id'],
          include: [
            {
              model: Tag,
              attributes: ['tagName'],
            },
          ],
        },
      ],
    });
    if (!post) {
      throw new NotFoundError('Không tìm thấy bài đăng');
    }
		await CacheRepository.set(`post:${slug}`,post,300);
    return post;
  }

  static async deletePost(postId: string) {
    const post = await Post.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundError('Không tìm thấy bài đăng');
    }
    await post.destroy();
    return;
  }

  static async approvePost(postId: string) {
    const post = await Post.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundError('Không tìm thấy bài đăng');
    }
		if (post.verified) {
			throw new BadRequestError('Bài đăng đã được duyệt');
		}
    post.verified = true;
    await post.save();
    return post;
  }

  static async getPosts(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const now = new Date();
    const { count, rows } = await Post.findAndCountAll({
      limit: limit,
      offset: offset,
      include: [
        {
          model: User,
          attributes: ['id', 'fullname', 'email', 'phone', 'avatar'],
        },
        {
          model: Image,
          attributes: [],
        },
      ],
      order: [['createdAt', 'DESC']],
      where: {
        [Op.or]: [
          { expiredDate: null }, 
          { expiredDate: { [Op.gt]: now } }, 
        ],
      }
    });
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

	static async searchPosts(keyword: string, addresses: string[], page: number = 1, limit: number = 10) {
		if (addresses.length > 5) {
			addresses = addresses.slice(0, 5);
		}
		const offset = (page - 1) * limit;
		const { count, rows } = await Post.findAndCountAll({
			where: {
				[Op.and]: [
					keyword
						? { title: { [Op.iLike]: `%${keyword}%` } } 
						: {}, 
					addresses.length > 0
						? { address: { [Op.in]: addresses } } 
						: {},
				],
			},
			limit,
			offset,
			order: [['createdAt', 'DESC']],
		});
		return {
			total: count,
			posts: rows,
			page,
			totalPages: Math.ceil(count / limit),
		};
	}
	


  static async getPostsForClient(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const posts = await Post.findAll({
      limit: limit,
      offset: offset,
      include: [
        {
          model: User,
          attributes: ['id', 'fullname', 'email', 'phone', 'avatar'],
        },
        {
          model: Image,
          attributes: [],
        },
      ],
    });
    return posts;
  }
}

export default PostService;
