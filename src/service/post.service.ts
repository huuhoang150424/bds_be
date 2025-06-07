import { ActionType, PriceUnit, ListingTypes, Directions, StatusPost } from '@models/enums/post';
import {
  User,
  Post,
  PostHistory,
  Tag,
  TagPost,
  Image,
  ListingType,
  PropertyType,
  UserPricing,
  Pricing,
  UserView,
  Wishlist,
  Comment,
  Rating,
} from '@models';
import { NotFoundError, BadRequestError, ForbiddenError } from '@helper';
import { v4 as uuidv4 } from 'uuid';
import { CacheRepository } from '@helper';
import { fn, literal, Op, QueryTypes } from 'sequelize';
import { sequelize } from '@config/database';
import NotificationService from './notification.service';
import type { ApprovalResult } from '@interface/post.interface';
import redisClient from '@config/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from 'index';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

class PostService {
  static async createPost(data: any, images: string[], userId: string) {
    const transaction = await sequelize.transaction();
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
      let priority = 0;
      if (userPricing && userPricing.pricing) {
        if (userPricing.pricing.name === 'VIP_1') {
          priority = 1;
        } else if (userPricing.pricing.name === 'VIP_2') {
          priority = 2;
        } else if (userPricing.pricing.name === 'VIP_3') {
          priority = 3;
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
      const priceUnit = listingType.listingType === 'Bán' ? PriceUnit.VND : PriceUnit.VNDPerMonth;
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
        priority,
      });
      await PropertyType.create({
        id: uuidv4(),
        name: data.propertyType,
        postId: newPost.id,
        listingTypeId: data.listingType,
      });
      await Promise.all(
        images.map(async (image) => {
          await Image.create({
            id: uuidv4(),
            imageUrl: image,
            postId: newPost.id,
          });
        }),
      );
      if (!Array.isArray(data.tags)) {
        data.tags = [data.tags];
      }
      console.log(data.tags);
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

  static async getPost(slug: string, userId?: string) {
    const cachePost = await CacheRepository.get(`post:${slug}`);
    if (cachePost) {
      return JSON.parse(cachePost);
    }

    const post = await Post.findOne({
      where: { slug },
      include: [
        {
          model: User,
          attributes: ['id', 'fullname', 'email', 'phone', 'avatar', 'active', 'lastActive'],
        },
        {
          model: Image,
          attributes: ['image_url'],
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
    if (userId) {
      const existingView = await UserView.findOne({
        where: {
          userId: userId,
          postId: post.id,
        },
      });

      if (!existingView) {
        await UserView.create({
          userId: userId,
          postId: post.id,
          viewedAt: new Date(),
        });
      }
    }

    const postCount = await Post.count({
      where: { userId: post.userId },
    });

    const priceHistory = await PostHistory.findAll({
      where: { postId: post.id },
      attributes: ['price', 'changedAt'],
      order: [['changedAt', 'ASC']],
    });

    const uniquePriceHistory = priceHistory
      .filter((history, index, self) => index === self.findIndex((h) => h.price === history.price))
      .map((history) => ({
        price: history.price,
        changed_at: history.changedAt,
      }));

    if (!uniquePriceHistory.some((h) => h.price === post.price)) {
      uniquePriceHistory.push({
        price: post.price,
        changed_at: post.updatedAt || new Date(),
      });
    }

    const postWithPriceHistory = {
      ...post.toJSON(),
      user: {
        ...post.user.toJSON(),
        postCount,
      },
      priceHistory: uniquePriceHistory,
    };

    await CacheRepository.set(`post:${slug}`, postWithPriceHistory, 300);
    return postWithPriceHistory;
  }

  static async deletePost(postId: string, userId: string) {
    const transaction = await sequelize.transaction();
    try {
      const post = await this.getPostById(postId);
      await this.savePostHistory(postId, userId, ActionType.DELETE, transaction);
      await post.destroy({ transaction });
      transaction.commit();
    } catch (err) {
      transaction.rollback();
      throw err;
    }
  }

  static async deletePosts(postIds: string[], adminId: string, reason: string) {
    const transaction = await sequelize.transaction();
    try {
      const posts = await Post.findAll({
        where: { id: postIds },
        include: [{ model: User, attributes: ['id', 'fullName', 'email'] }],
        transaction,
      });

      if (posts.length !== postIds.length) {
        throw new Error('Một số bài đăng không tồn tại');
      }

      for (const post of posts) {
        await this.savePostHistory(post.id, adminId, ActionType.DELETE, transaction);
        await NotificationService.createNotification(
          post.userId,
          `Bài đăng "${post.title}" đã bị xóa bởi quản trị viên vì: ${reason}`,
        );
        await post.destroy({ transaction });
      }

      await transaction.commit();
      return { message: `Xóa ${posts.length} bài đăng thành công` };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async approvePosts(postIds: string[]) {
    if (!postIds || postIds.length === 0) {
      throw new BadRequestError('Danh sách bài đăng không được rỗng');
    }

    const posts = await Post.findAll({
      where: { id: postIds },
    });

    if (posts.length !== postIds.length) {
      throw new NotFoundError('Một số bài đăng không tồn tại');
    }

    const alreadyApproved = posts.filter((post) => post.verified);
    if (alreadyApproved.length > 0) {
      throw new BadRequestError('Một số bài đăng đã được duyệt');
    }

    await Post.update({ verified: true }, { where: { id: postIds } });
    return await Post.findAll({
      where: { id: postIds },
    });
  }

  static async rejectPosts(postIds: string[], reason: string) {
    if (!postIds || postIds.length === 0) {
      console.log('check 1');
      throw new BadRequestError('Danh sách bài đăng không được rỗng');
    }

    if (!reason || reason.trim() === '') {
      console.log('check 2');
      throw new BadRequestError('Lý do từ chối không được để trống');
    }

    const posts = await Post.findAll({
      where: { id: postIds },
      include: [{ model: User }],
    });

    if (posts.length !== postIds.length) {
      throw new NotFoundError('Một số bài đăng không tồn tại');
    }

    const alreadyRejected = posts.filter((post) => post.isRejected === true);
    if (alreadyRejected.length > 0) {
      console.log('check 3');
      throw new BadRequestError('Một số bài đăng đã bị từ chối');
    }

    await Post.update(
      {
        isRejected: true,
      },
      { where: { id: postIds } },
    );

    for (const post of posts) {
      await NotificationService.createNotification(
        post.userId,
        `Bài đăng "${post.title}" của bạn đã bị từ chối. Lý do: ${reason}`,
      );
    }

    return await Post.findAll({
      where: { id: postIds },
      include: [{ model: User }],
    });
  }

  static async getPosts(page: number, limit: number, offset: number) {
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
          attributes: ['imageUrl'],
        },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [
            {
              model: ListingType,
              attributes: ['listingType'],
            },
          ],
        },
      ],
      distinct: true,

      order: [
        ['isRejected', 'DESC'],
        ['createdAt', 'DESC'],
        ['verified', 'ASC'],
      ],
    });
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async getPostByUser(page: number, limit: number, offset: number, userId: string) {
    const { count, rows } = await Post.findAndCountAll({
      limit: limit,
      offset: offset,
      include: [
        {
          model: Image,
          attributes: ['imageUrl'],
        },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [
            {
              model: ListingType,
              attributes: ['listingType'],
            },
          ],
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
      distinct: true,
      order: [['createdAt', 'DESC']],
      where: {
        userId,
      },
    });
    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    };
  }

  static async getPostTarget(userId: string) {
    const totals = await Post.findAll({
      where: { userId: userId },
      include: [
        {
          model: Image,
          attributes: ['imageUrl'],
        },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [
            {
              model: ListingType,
              attributes: ['listingType'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    return totals;
  }

  static async updatePost(
    postId: string,
    userId: string,
    data: any,
    deletedImageUrls: string[],
    newImageUrls: string[],
  ) {
    const transaction = await sequelize.transaction();
    try {
      const post = await this.getPostById(postId);

      if (post.userId !== userId) {
        throw new ForbiddenError('Bạn không có quyền cập nhật bài đăng này');
      }

      const { tags, ...updateData } = data;

      // Handle image updates
      if (deletedImageUrls.length > 0 || newImageUrls.length > 0) {
        if (deletedImageUrls.length > 0) {
          await Image.destroy({
            where: { postId, imageUrl: deletedImageUrls },
            transaction,
          });
        }

        if (newImageUrls.length > 0) {
          await Promise.all(
            newImageUrls.map(async (imageUrl) => {
              await Image.create({ id: uuidv4(), imageUrl, postId }, { transaction });
            }),
          );
        }
      }

      // Handle tags
      if (Array.isArray(tags)) {
        await TagPost.destroy({ where: { postId }, transaction });
        await Promise.all(
          tags.map(async (tagName: string) => {
            const [tag] = await Tag.findOrCreate({
              where: { tagName },
              defaults: { id: uuidv4(), tagName },
              transaction,
            });
            await TagPost.create({ tagId: tag.id, postId }, { transaction });
          }),
        );
      }

      // Handle property type update
      if (data.propertyType) {
        const existingPropertyType = await PropertyType.findOne({
          where: { postId },
          include: [{ model: ListingType }],
          transaction,
        });
        const listingTypeId = existingPropertyType?.listingTypeId;

        if (listingTypeId) {
          const [property, created] = await PropertyType.findOrCreate({
            where: { name: data.propertyType },
            defaults: {
              id: uuidv4(),
              name: data.propertyType,
              postId,
              listingTypeId,
            },
            transaction,
          });

          if (!created) {
            await property.update({ postId }, { transaction });
          }
        } else {
          console.log('Skipping property type update - missing listingTypeId');
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
        changeBy: userId,
        action: actionType,
      },
      { transaction },
    );
    return postHistory;
  }

  static async searchPosts(addresses: string[], page: number = 1, limit: number = 10, offset: number) {
    if (addresses.length > 5) {
      addresses = addresses.slice(0, 5);
    }
    const { count, rows } = await Post.findAndCountAll({
      where: {
        [Op.and]: [
          addresses.length > 0
            ? {
                [Op.or]: addresses.map((addr) => ({
                  address: { [Op.like]: `%${addr}%` },
                })),
              }
            : {},
        ],
      },
      include: [
        { model: Image, attributes: ['image_url'] },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [
            {
              model: ListingType,
              attributes: ['listingType'],
            },
          ],
        },
        { model: User, attributes: ['fullname', 'id', 'phone'] },
      ],
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

  private static bufferPool: any[] = [];

  static async getVerifiedPosts(page: number = 1, limit: number = 1000) {
    const startTime = Date.now();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const posts = await Post.findAll({
      where: {
        verified: true,
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      attributes: ['id', 'title', 'price', 'address', 'square_meters', 'priority', 'slug', 'created_at'],
      include: [
        {
          model: Image,
          attributes: ['image_url'],
          limit: 1,
          required: false,
        },
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']],
    });

    const formattedPosts = posts.map((post) => {
      const postData = post.toJSON();
      return {
        ...postData,
        image_url: postData.Image ? postData.Image.image_url : null,
      };
    });

    console.log(`getVerifiedPosts fetched ${formattedPosts.length} posts in ${Date.now() - startTime}ms`);
    return formattedPosts;
  }

  static shuffleArray(array: any[], preserveTopN: number = 0) {
    // Preserve the top N items to keep newest posts at the start
    const topItems = array.slice(0, preserveTopN);
    const shuffleItems = array.slice(preserveTopN);
    for (let i = shuffleItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleItems[i], shuffleItems[j]] = [shuffleItems[j], shuffleItems[i]];
    }
    return [...topItems, ...shuffleItems];
  }

  static async getRandomPosts(totalPosts = 50) {
    const allPosts = await this.getVerifiedPosts();
    if (!Array.isArray(allPosts)) {
      throw new BadRequestError('getVerifiedPosts() did not return an array');
    }
    const priorityGroups: Record<number, any[]> = { 3: [], 2: [], 1: [], 0: [] };
    allPosts.forEach((post) => {
      priorityGroups[post.priority].push(post);
    });

    Object.keys(priorityGroups).forEach((key) => {
      priorityGroups[Number(key)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    const finalPosts: any[] = [];
    const priorityLevels = [3, 2, 1, 0];

    const distribution: {
      3: number;
      2: number;
      1: number;
      0: number;
    } = {
      3: 0.5,
      2: 0.3,
      1: 0.15,
      0: 0.05,
    };

    for (const level of priorityLevels) {
      const maxPosts = Math.floor(totalPosts * distribution[level as keyof typeof distribution]);
      const selectedPosts = priorityGroups[level].slice(0, maxPosts);
      finalPosts.push(...selectedPosts);
    }

    const selectedCounts = finalPosts.reduce(
      (acc, post) => {
        acc[post.priority] = (acc[post.priority] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
    console.log('Selected posts by priority:', selectedCounts);

    const shuffledPosts = this.shuffleArray(finalPosts, 5);
    console.log(`getRandomPosts selected ${shuffledPosts.length} posts`);

    return shuffledPosts;
  }

  static async getPostsForClient(page: number, limit: number) {
    if (page < 1 || limit < 1) {
      throw new BadRequestError('Invalid page or limit');
    }

    this.bufferPool = await this.getRandomPosts(50);
    console.log(`getPostsForClient bufferPool size: ${this.bufferPool.length}`);

    console.log(
      'Top 5 posts in bufferPool:',
      this.bufferPool.slice(0, 5).map((p) => ({
        id: p.id,
        priority: p.priority,
        created_at: p.created_at,
      })),
    );

    return this.paginateData(this.bufferPool, page, limit);
  }

  static paginateData(data: any[], page: number, limit: number) {
    const totalPosts = data.length;
    const totalPages = Math.ceil(totalPosts / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedPosts = data.slice(offset, offset + limit);
    return {
      totalPosts,
      totalPages,
      currentPage: page,
      posts: paginatedPosts,
    };
  }

  static async getPostOutstanding() {
    // const cachedData = await CacheRepository.get('outstanding_posts');
    // if (cachedData) {
    //   return JSON.parse(cachedData);
    // }
    const posts = await Post.findAll({
      attributes: [
        'id',
        'title',
        'slug',
        'price',
        'squareMeters',
        'address',
        'createdAt',
        'priority',
        'priceUnit',
        'expiredDate',
        'status',
        [
          Post.sequelize!.literal(`
            (
              (SELECT COUNT(*) FROM user_views WHERE user_views.post_id = \`Post\`.\`id\`) * 0.5 +
              (SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = \`Post\`.\`id\`) * 0.3 +
              (SELECT COUNT(*) FROM comments WHERE comments.post_id = \`Post\`.\`id\`) * 0.2
            )`),
          'score',
        ],
      ],
      include: [
        { model: Image, attributes: ['image_url'], limit: 1 },
        { model: PropertyType, attributes: ['name'] },
      ],
      where: {
        verified: true,
        expiredDate: { [Op.gte]: new Date() },
      },
      order: [
        [Post.sequelize!.literal('score'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: 20,
    });
    // await CacheRepository.set('outstanding_posts', posts, 300);
    return posts;
  }

  static async getPostHabit(userId: string, limit: number = 10) {
    const cacheKey = `post_habit_${userId}`;
    const cachedData = await CacheRepository.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const userViews = await UserView.findAll({ where: { userId }, attributes: ['postId'] });
    const userWishlists = await Wishlist.findAll({ where: { userId }, attributes: ['postId'] });
    const userComments = await Comment.findAll({ where: { userId }, attributes: ['postId'] });
    const interactedPostIds: string[] = [
      ...new Set([
        ...userViews.map((v) => String(v.postId)),
        ...userWishlists.map((w) => String(w.postId)),
        ...userComments.map((c) => String(c.postId)),
      ]),
    ];

    if (interactedPostIds.length === 0) {
      const defaultPosts = await PostService.getDefaultRecommendations(limit);
      await CacheRepository.set(cacheKey, defaultPosts, 300);
      return defaultPosts;
    }

    const interactedPosts = await Post.findAll({
      where: { id: { [Op.in]: interactedPostIds } },
      include: [{ model: PropertyType, attributes: ['name'] }],
    });

    const contentScores = await PostService.calculateContentBasedScores(interactedPosts);

    const collabScores = await PostService.calculateCollaborativeScores(userId, interactedPostIds);

    const posts = await Post.findAll({
      attributes: ['id', 'title', 'slug', 'price', 'squareMeters', 'address', 'createdAt', 'priority'],
      include: [
        { model: Image, attributes: ['image_url'], limit: 1 },
        { model: PropertyType, attributes: ['name'] },
      ],
      where: {
        verified: true,
        status: { [Op.ne]: 'Đã bàn giao' },
        expiredDate: { [Op.gte]: new Date() },
        id: { [Op.notIn]: interactedPostIds },
      },
    });

    const now = Date.now();
    posts.forEach((post) => {
      const contentScore = contentScores[post.id] || 0;
      const collabScore = collabScores[post.id] || 0;
      const ageInDays = (now - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-0.05 * ageInDays);
      (post as any).score = contentScore * 0.4 + collabScore * 0.4 + post.priority * 0.2 * decayFactor;
    });

    const topPosts = posts.sort((a, b) => (b as any).score - (a as any).score).slice(0, limit);

    if (topPosts.length > 0) {
      await CacheRepository.set(cacheKey, topPosts, 300);
    }

    return topPosts;
  }

  private static async calculateContentBasedScores(interactedPosts: Post[]) {
    const scores: { [postId: string]: number } = {};
    const avgPrice = interactedPosts.reduce((sum, p) => sum + p.price, 0) / interactedPosts.length;
    const avgArea = interactedPosts.reduce((sum, p) => sum + p.squareMeters, 0) / interactedPosts.length;
    const propertyTypes = [...new Set(interactedPosts.map((p) => p.propertyType[0]?.name))];

    const allPosts = await Post.findAll({
      where: { verified: true, status: { [Op.ne]: 'Đã bàn giao' }, expiredDate: { [Op.gte]: new Date() } },
      include: [{ model: PropertyType, attributes: ['name'] }],
    });

    allPosts.forEach((post) => {
      let similarity = 0;
      similarity += 1 - Math.abs(post.price - avgPrice) / avgPrice;
      similarity += 1 - Math.abs(post.squareMeters - avgArea) / avgArea;
      if (propertyTypes.includes(post.propertyType[0]?.name)) similarity += 1;
      scores[post.id] = similarity / 3;
    });

    return scores;
  }

  private static async calculateCollaborativeScores(userId: string, interactedPostIds: string[]) {
    const scores: { [postId: string]: number } = {};

    const similarUsers = await UserView.findAll({
      where: { postId: { [Op.in]: interactedPostIds }, userId: { [Op.ne]: userId } },
      attributes: ['userId'],
      group: ['userId'],
    });
    const similarUserIds = similarUsers.map((u) => u.userId);

    const similarInteractions = await Promise.all([
      UserView.findAll({ where: { userId: { [Op.in]: similarUserIds } }, attributes: ['postId'] }),
      Wishlist.findAll({ where: { userId: { [Op.in]: similarUserIds } }, attributes: ['postId'] }),
      Comment.findAll({ where: { userId: { [Op.in]: similarUserIds } }, attributes: ['postId'] }),
    ]);

    const recommendedPostIds = [
      ...new Set(
        similarInteractions
          .flat()
          .map((i) => String(i.postId))
          .filter((id) => !interactedPostIds.includes(id)),
      ),
    ];

    recommendedPostIds.forEach((postId) => {
      scores[postId] = (scores[postId] || 0) + 1;
    });

    const maxScore = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach((postId) => {
      scores[postId] /= maxScore;
    });

    return scores;
  }
  private static async getDefaultRecommendations(limit: number) {
    return await Post.findAll({
      attributes: [
        'id',
        'title',
        'slug',
        'price',
        'squareMeters',
        'address',
        'createdAt',
        'priority',
        'priceUnit',
        'expiredDate',
        'status',
      ],
      include: [
        { model: Image, attributes: ['image_url'], limit: 1 },
        { model: PropertyType, attributes: ['name'] },
      ],
      where: {
        verified: true,
        expiredDate: { [Op.gte]: new Date() },
      },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }
  static async filterPosts(query: any, page: number = 1, limit: number = 10, offset: number) {
    const {
      keyword,
      tagIds,
      minPrice,
      maxPrice,
      floor,
      minSquareMeters,
      maxSquareMeters,
      directions,
      bedrooms,
      bathrooms,
      propertyTypeIds,
      listingTypeIds,
      sortBy,
      order,
      ratings,
      isProfessional,
      status,
      isFurniture,
    } = query;
    const toArray = <T>(value: any, parser: (v: any) => T): T[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map(parser);
      return [parser(value)];
    };
    const whereCondition: any = {};
    if (status) {
      const statusArray = toArray(status, String);
      if (statusArray.length > 0) {
        whereCondition.status = { [Op.in]: statusArray };
      }
    }
    if (keyword) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (minPrice || maxPrice) {
      whereCondition.price = {
        ...(minPrice ? { [Op.gte]: Number(minPrice) } : {}),
        ...(maxPrice ? { [Op.lte]: Number(maxPrice) } : {}),
      };
    }
    if (minSquareMeters || maxSquareMeters) {
      whereCondition.squareMeters = {
        ...(minSquareMeters ? { [Op.gte]: Number(minSquareMeters) } : {}),
        ...(maxSquareMeters ? { [Op.lte]: Number(maxSquareMeters) } : {}),
      };
    }
    const directionArray = toArray(directions, String);
    if (directionArray.length > 0) {
      whereCondition.direction = { [Op.in]: directionArray };
    }
    const bedroomArray = toArray(bedrooms, Number);
    if (bedroomArray.length > 0) {
      whereCondition.bedroom = { [Op.in]: bedroomArray };
    }
    const bathroomArray = toArray(bathrooms, Number);
    if (bathroomArray.length > 0) {
      whereCondition.bathroom = { [Op.in]: bathroomArray };
    }
    if (floor) {
      whereCondition.floor = Number(floor);
    }
    if (typeof isFurniture !== 'undefined') {
      whereCondition.isFurniture = isFurniture === 'true';
    }
    const includeConditions: any = [
      { model: Image, attributes: ['image_url'] },
      {
        model: User,
        attributes: ['fullname', 'id', 'phone', 'isProfessional'],
        where: isProfessional === 'true' ? { isProfessional: true } : undefined,
        required: isProfessional === 'true' ? true : false,
      },
    ];
    const ratingArray = toArray(ratings, Number);
    if (ratingArray.length > 0) {
      includeConditions.push({
        model: Rating,
        where: {
          rating: { [Op.in]: ratingArray },
        },
        required: true,
      });
    }

    // Fixed tag filtering
    const tagIdArray = toArray(tagIds, String);
    if (tagIdArray.length > 0) {
      whereCondition.id = {
        [Op.in]: sequelize.literal(`(
        SELECT tp.postId 
        FROM tag_posts AS tp
        WHERE tp.tagId IN (${tagIdArray.map((id) => `'${id}'`).join(',')})
        AND tp.postId IS NOT NULL
        GROUP BY tp.postId
        HAVING COUNT(DISTINCT tp.tagId) = ${tagIdArray.length}
      )`),
      };
    }

    const propertyTypeNameArray = toArray(propertyTypeIds, String);
    const listingTypeEnumArray = toArray(listingTypeIds, String);
    if (listingTypeEnumArray.length > 0) {
      whereCondition.id = {
        ...whereCondition.id,
        [Op.in]: sequelize.literal(`(
        SELECT propertyType.post_id 
        FROM property_types AS propertyType
        INNER JOIN listing_types AS listingType 
        ON propertyType.listing_type_id = listingType.id
        AND listingType.listing_type IN (${listingTypeEnumArray.map((type) => `'${type}'`).join(',')})
        WHERE propertyType.post_id IS NOT NULL
      )`),
      };
    }
    if (propertyTypeNameArray.length > 0) {
      includeConditions.push({
        model: PropertyType,
        where: {
          slug: { [Op.in]: propertyTypeNameArray },
        },
        required: true,
      });
    }

    let orderCondition: any = [['createdAt', 'DESC']];
    if (sortBy) {
      const orderType = order === 'asc' ? 'ASC' : 'DESC';
      orderCondition = [[sortBy, orderType]];
    }

    // Handle case where we have both tag filter and listing type filter
    if (tagIdArray.length > 0 && listingTypeEnumArray.length > 0) {
      whereCondition.id = {
        [Op.and]: [
          sequelize.literal(`id IN (
          SELECT tp.postId 
          FROM tag_posts AS tp
          WHERE tp.tagId IN (${tagIdArray.map((id) => `'${id}'`).join(',')})
          AND tp.postId IS NOT NULL
          GROUP BY tp.postId
          HAVING COUNT(DISTINCT tp.tagId) = ${tagIdArray.length}
        )`),
          sequelize.literal(`id IN (
          SELECT propertyType.post_id 
          FROM property_types AS propertyType
          INNER JOIN listing_types AS listingType 
          ON propertyType.listing_type_id = listingType.id
          AND listingType.listing_type IN (${listingTypeEnumArray.map((type) => `'${type}'`).join(',')})
          WHERE propertyType.post_id IS NOT NULL
        )`),
        ],
      };
    }

    const { count, rows } = await Post.findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      limit,
      offset: offset || (page - 1) * limit,
      order: orderCondition,
      distinct: true,
    });

    return {
      total: count,
      posts: rows,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  static async getListingTypes(): Promise<{ id: string; listingType: string }[]> {
    const listingTypes = await ListingType.findAll({
      raw: true,
    });

    return listingTypes;
  }

  static async createListingType(listingType: ListingTypes) {
    const existingListingType = await ListingType.findOne({
      where: { listingType },
    });
    if (existingListingType) {
      throw new BadRequestError('Danh mục đã tồn tại');
    }
    const newListingType = await ListingType.create({ listingType });
    return newListingType;
  }

  static async deleteListingType(id: string): Promise<void> {
    const listingType = await ListingType.findByPk(id);
    if (!listingType) {
      throw new NotFoundError('Danh mục không tồn tại');
    }

    const propertyTypes = await listingType.$get('propertyType');
    if (propertyTypes && propertyTypes.length > 0) {
      throw new BadRequestError('Không thể xóa danh mục');
    }

    await listingType.destroy();
  }

  static async updateListingType(id: string, listingType: ListingTypes) {
    const listingTypeRecord = await ListingType.findByPk(id);

    if (!listingTypeRecord) {
      throw new NotFoundError('Danh mục không tồn tại');
    }
    const existingListingType = await ListingType.findOne({
      where: { listingType },
    });

    if (existingListingType) {
      throw new BadRequestError('Danh mục đã tồn tại');
    }

    listingTypeRecord.listingType = listingType;
    await listingTypeRecord.save();

    return listingTypeRecord;
  }

  private static readonly MAX_POSTS_PER_RUN = 3;
  private static readonly REQUEST_INTERVAL = 30000;
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 26000;
  private static readonly QUEUE_KEY = 'post_approval_queue';
  private static readonly RESULTS_KEY_PREFIX = 'approval_results_';

  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async enqueuePostsForAiApproval(): Promise<string[]> {
    const posts = await Post.findAll({
      where: { verified: false, isRejected: false },
      attributes: [
        'id',
        'title',
        'price',
        'priceUnit',
        'squareMeters',
        'bedroom',
        'bathroom',
        'floor',
        'isFurniture',
        'direction',
        'description',
        'address',
        'status',
        'verified',
      ],
      include: [{ model: User }],
      limit: this.MAX_POSTS_PER_RUN,
    });

    if (posts.length === 0) {
      throw new BadRequestError('Không có bài đăng nào chưa duyệt để xử lý');
    }

    const postData = posts.map((post) => JSON.stringify(post.toJSON()));
    await redisClient.lPush(this.QUEUE_KEY, postData);

    return posts.map((post) => post.id);
  }

  static async processAiApprovalQueue(): Promise<ApprovalResult[]> {
    const results: ApprovalResult[] = [];
    const batch = await redisClient.lRange(this.QUEUE_KEY, 0, this.MAX_POSTS_PER_RUN - 1);

    if (batch.length === 0) {
      return results;
    }

    for (let i = 0; i < batch.length; i++) {
      const postData = batch[i];
      let post;
      try {
        post = JSON.parse(postData);
      } catch (parseError) {
        console.error(`Lỗi parse dữ liệu bài đăng từ queue:`, postData, parseError);
        continue;
      }

      console.log(`Đang xử lý bài đăng ${post.id}`);
      const approvalResult = await this.evaluatePostWithAI(post, 0);
      console.log(`Kết quả đánh giá AI cho bài đăng ${post.id}:`, approvalResult);

      try {
        const [affectedRows] = await Post.update(
          {
            verified: approvalResult.approved,
            isRejected: !approvalResult.approved,
          },
          { where: { id: post.id } },
        );
        if (affectedRows === 0) {
          console.warn(`Không có bản ghi nào được cập nhật cho bài đăng ${post.id}. Có thể bài đăng không tồn tại.`);
        }
      } catch (updateError) {
        console.error(`Lỗi khi cập nhật bài đăng ${post.id}:`, updateError);
      }

      results.push(approvalResult);

      io.emit('approvalProgress', {
        processed: i + 1,
        total: batch.length,
        progress: ((i + 1) / batch.length) * 100,
      });

      if (i < batch.length - 1) {
        await this.delay(this.REQUEST_INTERVAL);
      }
    }

    await redisClient.lTrim(this.QUEUE_KEY, batch.length, -1);

    const batchId = Date.now().toString();
    await CacheRepository.set(`${this.RESULTS_KEY_PREFIX}${batchId}`, results, 3600);

    const posts = await Post.findAll({
      where: { id: results.map((r) => r.postId) },
      include: [{ model: User }],
    });

    for (const result of results) {
      const post = posts.find((p) => p.id === result.postId);
      if (post && post.user) {
        const message = result.approved
          ? `Bài đăng "${post.title}" của bạn đã được duyệt thành công.`
          : `Bài đăng "${post.title}" của bạn đã bị từ chối. Lý do: ${result.reason || 'Không xác định'}`;
        await NotificationService.createNotification(post.userId, message);
      }
    }

    return results;
  }

  // Đánh giá bài đăng với AI
  private static async evaluatePostWithAI(post: any, retryCount: number = 0): Promise<ApprovalResult> {
    const prompt = `
      Bạn là một trợ lý AI chuyên đánh giá bài đăng bất động sản tại Việt Nam, với nhiệm vụ phát hiện nội dung lừa đảo hoặc spam. Nhiệm vụ của bạn là phân tích thông tin bài đăng và quyết định xem bài đăng có hợp lý để được duyệt hay không. Trả về một object JSON với định dạng:
      {
        "approved": boolean,
        "reason": string // Để trống nếu duyệt, cung cấp lý do cụ thể nếu từ chối
      }

      **Thông tin bài đăng**:
      ${JSON.stringify(post, null, 2)}

      **Tiêu chí đánh giá** (dựa trên thị trường bất động sản Việt Nam):
      1. **Giá (price)**:
          - Phải > 0 và hợp lý so với diện tích (squareMeters).
          - Tham khảo: Giá trung bình 30-100 triệu VND/m² cho căn hộ chung cư, 50-200 triệu VND/m² cho nhà phố.
          - Giá/m² < 5 triệu hoặc > 500 triệu là dấu hiệu lừa đảo, trừ khi mô tả giải thích rõ (ví dụ: vị trí cao cấp, nội thất xa xỉ).
      2. **Diện tích (squareMeters)**:
          - Phải > 0.
          - Phải đủ lớn cho số phòng ngủ và phòng tắm (tối thiểu 20m²/phòng ngủ, 10m²/phòng tắm).
      3. **Phòng ngủ (bedroom) và phòng tắm (bathroom)**:
          - Phải >= 0.
          - Tổng số phòng (bedroom + bathroom) tối đa 1 phòng/10m².
          - Nếu số phòng không hợp lý (ví dụ: 5 phòng ngủ trong 30m²), xem là dấu hiệu lừa đảo.
      4. **Mô tả (description)**:
          - Phải liên quan đến bất động sản (mô tả nhà, vị trí, tiện ích).
          - Tối thiểu 20 ký tự, không chỉ chứa số hoặc ký tự đặc biệt.
          - **Dấu hiệu lừa đảo/spam**:
            - Ngôn ngữ cường điệu, gây áp lực (ví dụ: "Mua ngay kẻo lỡ!", "Giá rẻ nhất thị trường!").
            - Nội dung không liên quan (ví dụ: quảng cáo sản phẩm, dịch vụ khác).
            - Chứa thông tin liên hệ (số điện thoại, email, link URL) trong mô tả.
            - Nội dung lặp lại, chung chung, hoặc giống bài đăng khác (dấu hiệu spam).
            - Từ ngữ xúc phạm, thông tin giả mạo, hoặc nội dung không phù hợp.
      5. **Địa chỉ (address)**:
          - Phải không rỗng, tối thiểu 10 ký tự.
          - Phải hợp lệ theo định dạng địa chỉ Việt Nam, bao gồm ít nhất một trong các thành phần: số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố.
          - **Dấu hiệu lừa đảo**:
            - Địa chỉ quá chung (ví dụ: "Hà Nội", "TP.HCM").
            - Địa chỉ không tồn tại hoặc không hợp lý (ví dụ: "123 ABC, Quận 99").
            - Địa chỉ lặp lại nhiều lần trong các bài đăng khác (dấu hiệu spam).
      6. **Tầng (floor)**:
          - Nếu có, phải >= -1 (tầng hầm) và <= 100.
      7. **Nội thất (isFurniture)**:
          - Phải là boolean (true/false).
      8. **Hướng (direction)**:
          - Phải thuộc danh sách: ${Object.values(Directions).join(', ')}.
      9. **Trạng thái (status)**:
          - Phải thuộc danh sách: ${Object.values(StatusPost).join(', ')}.

      **Hướng dẫn**:
      - Đánh giá từng tiêu chí theo thứ tự, ưu tiên phát hiện lừa đảo/spam.
      - Dừng lại ngay khi phát hiện vấn đề, cung cấp lý do cụ thể liên quan đến tiêu chí vi phạm.
      - Lý do từ chối phải ngắn gọn, rõ ràng, và đề cập đến lừa đảo/spam nếu phù hợp.
      - Nếu tất cả tiêu chí hợp lý và không có dấu hiệu lừa đảo/spam, trả về approved: true và reason: "".
      - Đặc biệt chú ý đến mô tả và địa chỉ để phát hiện nội dung lừa đảo hoặc spam.

      **Ví dụ**:
      - Bài đăng: { "price": 100000000, "squareMeters": 50, "address": "Hà Nội", "description": "Bán nhà giá rẻ, liên hệ 0901234567 ngay!" }
        -> { "approved": false, "reason": "Mô tả chứa số điện thoại và địa chỉ quá chung, có dấu hiệu lừa đảo" }
      - Bài đăng: { "price": 5000000000, "squareMeters": 30, "bedroom": 5, "address": "123 Nguyễn Huệ, Quận 1, TP.HCM", "description": "Nhà đẹp, mua ngay!" }
        -> { "approved": false, "reason": "Giá 166 triệu/m² quá cao và 5 phòng ngủ không hợp lý cho 30m², có dấu hiệu lừa đảo" }
      - Bài đăng: { "address": "TP.HCM", "description": "Căn hộ cao cấp, giá tốt, liên hệ qua zalo.me/abc" }
        -> { "approved": false, "reason": "Mô tả chứa link liên hệ và địa chỉ quá chung, có dấu hiệu spam" }
      - Bài đăng: { "price": 3000000000, "squareMeters": 60, "bedroom": 2, "bathroom": 1, "address": "456 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM", "description": "Căn hộ 2 phòng ngủ, nội thất đầy đủ, gần trung tâm" }
        -> { "approved": true, "reason": "" }
    `;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json|```/g, '').trim();
      const parsedResult = JSON.parse(responseText);

      return {
        postId: post.id,
        approved: parsedResult.approved,
        reason: parsedResult.reason || undefined,
      };
    } catch (error: any) {
      if (error.status === 429 && retryCount < this.MAX_RETRIES) {
        const delay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.warn(`Lỗi 429, thử lại sau ${delay / 1000} giây...`);
        await this.delay(delay);
        return this.evaluatePostWithAI(post, retryCount + 1);
      }

      console.error('Lỗi khi đánh giá bài đăng với GeminiAI:', error);
      return {
        postId: post.id,
        approved: false,
        reason: 'Lỗi khi đánh giá bài đăng bằng AI, có thể do vượt quá giới hạn quota',
      };
    }
  }

  static async getPostCountByLocation(address: string) {
    const invalidAddresses = [undefined, null, '', 'Đang tải...', 'Không xác định', 'Không thể xác định quận/huyện'];

    if (invalidAddresses.includes(address)) {
      const totalPosts = await Post.count();
      return [
        {
          address: 'Tất cả vị trí',
          postCount: totalPosts,
          level: 'all',
        },
      ];
    }

    const searchAddress = address.trim();
    let where: any = {};
    let posts: any[] = [];

    const addressParts = searchAddress.split(',').map((part) => part.trim());
    const districtKeywords = ['quận', 'huyện', 'thị xã'];
    let district =
      addressParts.find((part) => districtKeywords.some((keyword) => part.toLowerCase().includes(keyword))) || '';

    if (!district && addressParts.length > 1) {
      district = addressParts[addressParts.length - 2];
    }
    if (district) {
      where = {
        address: { [Op.like]: `%${district}%` },
      };

      posts = await Post.findAll({
        where,
        attributes: [
          ['address', 'full_address'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
        ],
        group: ['address'],
        raw: true,
        limit: 100,
      });
      // Gộp nhóm theo quận/huyện
      const districtPostCount: Record<string, number> = {};

      posts.forEach((post) => {
        const postDistrict =
          post.full_address
            .split(',')
            .map((p: string) => p.trim())
            .find((p: string) => districtKeywords.some((keyword) => p.toLowerCase().includes(keyword))) || district;

        districtPostCount[postDistrict] = (districtPostCount[postDistrict] || 0) + Number(post.postCount);
      });

      posts = Object.entries(districtPostCount).map(([districtName, count]) => ({
        full_address: districtName,
        postCount: count,
      }));
    }
    if (posts.length === 0) {
      where = {
        address: { [Op.like]: `%${searchAddress}%` },
      };

      posts = await Post.findAll({
        where,
        attributes: [
          ['address', 'full_address'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
        ],
        group: ['address'],
        raw: true,
        limit: 100,
      });
      if (posts.length === 0) {
        const searchTerms = [
          searchAddress,
          `Quận ${searchAddress}`,
          `quận ${searchAddress}`,
          `Huyện ${searchAddress}`,
          `huyện ${searchAddress}`,
        ];

        const orConditions = searchTerms.map((term) => ({
          address: { [Op.like]: `%${term}%` },
        }));

        where = { [Op.or]: orConditions };

        posts = await Post.findAll({
          where,
          attributes: [
            ['address', 'full_address'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
          ],
          group: ['address'],
          raw: true,
          limit: 100,
        });
        if (posts.length === 0) {
          const words = searchAddress.split(/\s+/).filter((word) => word.length > 2);

          if (words.length > 0) {
            const wordConditions = words.map((word) => ({
              address: { [Op.like]: `%${word}%` },
            }));

            where = { [Op.or]: wordConditions };

            posts = await Post.findAll({
              where,
              attributes: [
                ['address', 'full_address'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
              ],
              group: ['address'],
              raw: true,
              limit: 100,
            });
          }
        }
      }
    }
    const result = posts.map((post: any) => {
      const addressParts = post.full_address.split(',').map((part: string) => part.trim());
      let level: 'full' | 'district' | 'province' = 'full';
      if (addressParts.length <= 2) {
        level = 'district';
      }
      if (addressParts.length === 1) {
        level = 'province';
      }
      const postAddressLower = post.full_address.toLowerCase();
      const searchAddressLower = searchAddress.toLowerCase();
      let relevance = 0;

      if (postAddressLower.includes(searchAddressLower)) {
        relevance = 100;
      } else {
        const searchWords = searchAddressLower.split(/\s+/);
        const addressWords = postAddressLower.split(/\s+/);
        let matchCount = 0;

        searchWords.forEach((word: string) => {
          if (addressWords.some((addrWord: string) => addrWord.includes(word))) {
            matchCount++;
          }
        });

        relevance = Math.round((matchCount / searchWords.length) * 100);
      }

      return {
        address: post.full_address,
        postCount: Number(post.postCount),
        level,
        relevance,
      };
    });
    return result.sort((a, b) => b.relevance - a.relevance);
  }

  static async getPostsByMapBounds(page: number, limit: number, offset: number, adress: string) {
    const where: any = {};
    console.log(adress);
    if (adress) {
      where.address = { [Op.like]: `%${adress}%` };
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'fullname', 'avatar'],
        },
        {
          model: Image,
          attributes: ['imageUrl'],
          limit: 1,
        },
        {
          model: PropertyType,
          attributes: ['name'],
          include: [{ model: ListingType, attributes: ['listingType'] }],
        },
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
    });

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      posts: rows,
    };
  }
  static async getTopPostsByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const replacements = {
      startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
      endDate: endDate.toISOString().slice(0, 19).replace('T', ' '),
    };

    const postAttributes = [
      'id',
      'title',
      'slug',
      'price',
      'priceUnit',
      'address',
      'squareMeters',
      'description',
      'createdAt',
      'floor',
      'bedroom',
      'bathroom',
      'priority',
      'isFurniture',
      'isRejected',
      'direction',
      'verified',
      'expiredDate',
      'status',
      'userId',
    ];

    const includeModels = [
      {
        model: User,
        attributes: ['id', 'fullname', 'email', 'phone', 'avatar'],
      },
      {
        model: Image,
        attributes: ['id', 'image_url'],
      },
      {
        model: TagPost,
        attributes: ['id'],
        include: [
          {
            model: Tag,
            attributes: ['id', 'tag_name'],
          },
        ],
      },
    ];

    const interactionCountSQL = `
    (SELECT COUNT(*) FROM user_views WHERE user_views.post_id = Post.id AND user_views.viewed_at BETWEEN :startDate AND :endDate) +
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = Post.id AND comments.created_at BETWEEN :startDate AND :endDate) +
    (SELECT COUNT(*) FROM ratings WHERE ratings.post_id = Post.id AND ratings.created_at BETWEEN :startDate AND :endDate) +
    (SELECT COUNT(*) FROM wishlists WHERE wishlists.post_id = Post.id AND wishlists.created_at BETWEEN :startDate AND :endDate)
  `;

    const postsWithInteractions = await Post.findAll({
      attributes: [...postAttributes, [fn('COALESCE', literal(interactionCountSQL), 0), 'interactionCount']],
      include: includeModels,
      where: {
        status: 'Còn trống',
        verified: true,
        createdAt: { [Op.lte]: endDate },
        [Op.and]: [literal(`${interactionCountSQL} > 0`)],
      },
      order: [
        [literal('interactionCount'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
      replacements,
      subQuery: false,
    });

    if (postsWithInteractions.length >= 5) {
      return postsWithInteractions.slice(0, 5);
    }

    const remainingCount = 5 - postsWithInteractions.length;
    const postsWithoutInteractions = await Post.findAll({
      attributes: [...postAttributes, [literal('0'), 'interactionCount']],
      include: includeModels,
      where: {
        status: 'Còn trống',
        verified: true,
        createdAt: { [Op.lte]: endDate },
        id: { [Op.notIn]: postsWithInteractions.map((post) => post.id) },
        [Op.and]: [literal(`${interactionCountSQL} = 0`)],
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: remainingCount,
      replacements,
      subQuery: false,
    });

    return [...postsWithInteractions, ...postsWithoutInteractions];
  }
}

export default PostService;
