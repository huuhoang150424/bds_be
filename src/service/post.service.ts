
import { ActionType } from '@models/enums/post';
import { User, Post, PostHistory, Tag, TagPost, Image, ListingType, PropertyType,UserPricing,Pricing  } from '@models';
import { NotFoundError, BadRequestError } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import { CacheRepository } from '@helper';
import { Op } from 'sequelize';
import { sequelize } from '@config/database';


class PostService {
  static async createPost(data: any, images: string[], userId: string) {
    const transaction=await sequelize.transaction();
    try {
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
      let priority=0;
      if (userPricing && userPricing.pricing) {
        if (userPricing.pricing.name==="VIP_1") {
          priority=1;
        } else if (userPricing.pricing.name==="VIP_2") {
          priority=2;
        }else if (userPricing.pricing.name==="VIP_3") {
          priority=3;
        } 
      }
      const pricing = userPricing.pricing;
      //check count post
      if (!pricing || pricing.name === 'VIP_1') {
        if (userPricing.remainingPosts <= 0) {
          throw new BadRequestError(
            `Bạn đã đạt giới hạn ${userPricing.remainingPosts} bài đăng trong tháng. Hãy nâng cấp gói thành viên!`,
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
        squareMeters: data.squareMeters,
        description: data.description,
        floor: data.floor,
        bedroom: data.bedroom,
        bathroom: data.bathroom,
        isFurniture: data.isFurniture,
        direction: data.direction,
        status: data.status,
        priceUnit: priceUnit,
        price: data.price,
        expiredDate: expiredDate,
        priority
      });
      await PropertyType.create({
        id: uuidv4(),
        name: data.propertyType,
        postId: newPost.id,
        listingTypeId: data.listingType,
      })
      await Promise.all(
        images.map(async (image) => {
          await Image.create({
            id: uuidv4(),
            imageUrl: image,
            postId: newPost.id,
          });
        }),
      );
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        await Promise.all(
          data.tags.map(async (tagName: string) => {
            const [tag] = await Tag.findOrCreate({
              where: { tagName },
              defaults: { id: uuidv4(), tagName },
            });
            await TagPost.create({
              tagId: tag.id,
              postId: newPost.id,
            });
          }),
        );
      }
      if (!pricing || pricing.name === 'VIP_1') {
        userPricing.remainingPosts -= 1;
        await userPricing.save();
      }
      await this.savePostHistory(newPost.id, userId, ActionType.CREATE, transaction);
      await transaction.commit();
      return newPost;
    } catch (err) {
      transaction.rollback();
      throw err;
    }
  }

  static async getPostById(postId: string) {
    const post = await Post.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundError('Bài đăng không tồn tại');
    }
    return post;
  }

  static async getPost(slug: string) {
    const cachePost = await CacheRepository.get(`post:${slug}`);
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
    await CacheRepository.set(`post:${slug}`, post, 300);
    return post;
  }

  static async deletePost(postId: string,userId:string) {
    const transaction=await sequelize.transaction();
    try {
      const post=await this.getPostById(postId);
      await this.savePostHistory(postId,userId,ActionType.DELETE,transaction);
      await post.destroy({transaction});
      transaction.commit();
    } catch (err) {
      transaction.rollback();
      throw err;
    }
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
        [Op.or]: [{ expiredDate: null }, { expiredDate: { [Op.gt]: now } }],
      },
    });
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async updatePost(postId: string, userId: string, data: any, imageUrls: string[]) {
    const transaction = await sequelize.transaction();
    try {
      const post = await this.getPostById(postId);
      const { tags, propertyType, ...updateData } = data;
      const listingType = await ListingType.findOne({
        where: { id: data.listingType },
      });
      if (!listingType) {
        throw new BadRequestError('Loại tin đăng không hợp lệ');
      }

      if (Array.isArray(imageUrls)) {
        const existingImages = await Image.findAll({ where: { postId } });
        const existingUrls = existingImages.map((img) => img.imageUrl);
        const imagesToDelete = existingImages.filter((img) => !imageUrls.includes(img.imageUrl));
        if (imagesToDelete.length > 0) {
          await Image.destroy({
            where: { id: imagesToDelete.map((img) => img.id) },
            transaction,
          });
        }
        const newImages = imageUrls.filter((url) => !existingUrls.includes(url));
        await Promise.all(
          newImages.map(async(imageUrl) => await Image.create({ id: uuidv4(), imageUrl, postId }, { transaction })),
        );
      }
      if (Array.isArray(tags)) {
        await TagPost.destroy({ where: { postId }, transaction });
        await Promise.all(
          tags.map(async (tagName) => {
            const [tag] = await Tag.findOrCreate({
              where: { tagName },
              defaults: { id: uuidv4(), tagName },
              transaction,
            });
            await TagPost.create({ tagId: tag.id, postId }, { transaction });
          }),
        );
      }
      if (propertyType) {
        const [property, created] = await PropertyType.findOrCreate({
          where: { name: propertyType },
          defaults: {
            id: uuidv4(),
            name: propertyType,
            postId,
            listingTypeId: listingType.id,
          },
          transaction,
        });
        if (!created) {
          await property.update({ postId }, { transaction });
        }
      }

      await post.update(updateData, { transaction });
      await this.savePostHistory(postId, userId, ActionType.UPDATE, transaction);
      await transaction.commit();
      return post;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async savePostHistory(postId: string, userId: string, actionType: ActionType, transaction: any) {
    const findPost = await this.getPostById(postId);
    const postHistory = await PostHistory.create(
      {
        postId,
        userId,
        title: findPost.title,
        address: findPost.address,
        slug: findPost.slug,
        price: findPost.price,
        squareMeters: findPost.squareMeters,
        description: findPost.description,
        floor: findPost.floor,
        bedroom: findPost.bedroom,
        bathroom: findPost.bathroom,
        isFurniture: findPost.isFurniture,
        direction: findPost.direction,
        verified: findPost.verified,
        expiredDate: findPost.expiredDate,
        priority: findPost.priority,
        status: findPost.status,
        changedAt: new Date(),
        changeBy:userId,
        action: actionType,
      },
      { transaction },
    );
    return postHistory;
  }

  static async searchPosts(keyword: string, addresses: string[], page: number = 1, limit: number = 10) {
    if (addresses.length > 5) {
      addresses = addresses.slice(0, 5);
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await Post.findAndCountAll({
      where: {
        [Op.and]: [
          keyword ? { title: { [Op.iLike]: `%${keyword}%` } } : {},
          addresses.length > 0 ? { address: { [Op.in]: addresses } } : {},
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
