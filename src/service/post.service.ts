import { ActionType, PriceUnit, ListingTypes } from '@models/enums/post';
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
import { Op } from 'sequelize';
import { sequelize } from '@config/database';
import NotificationService from './notification.service';

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
      console.log("check 1");
      throw new BadRequestError('Danh sách bài đăng không được rỗng');
    }
  
    if (!reason || reason.trim() === '') {
      console.log("check 2");
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
      console.log("check 3");
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

  static async getVerifiedPosts() {
    const cacheKey = `verified_posts`;
    const cachedData = await CacheRepository.get(cacheKey);
    if (cachedData) {
      if (Array.isArray(cachedData)) {
        return cachedData;
      } else {
        await CacheRepository.delete(cacheKey);
      }
    }
    const posts = await Post.findAll({
      where: { verified: true },
      include: [
        {
          model: Image,
          attributes: ['image_url'],
          limit: 1,
        },
      ],
      //raw: true,
    });
    const formattedPosts = posts.map((post) => {
      const postData = post.toJSON();
      return {
        ...postData,
        image_url: postData.Image ? postData.Image.image_url : null,
      };
    });

    await CacheRepository.set(cacheKey, formattedPosts, 600);
    return posts;
  }

  static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static async getRandomPosts(totalPosts = 20) {
    const allPosts = await this.getVerifiedPosts();
    if (!Array.isArray(allPosts)) {
      throw new BadRequestError('getVerifiedPosts() did not return an array');
    }
    const priorityGroups: Record<number, any[]> = { 3: [], 2: [], 1: [], 0: [] };
    allPosts.forEach((post) => {
      priorityGroups[post.priority].push(post);
    });

    const finalPosts: any[] = [];
    const priorityLevels = [3, 2, 1, 0];
    for (const level of priorityLevels) {
      const needed = totalPosts - finalPosts.length;
      if (needed <= 0) break;
      finalPosts.push(...priorityGroups[level].slice(0, needed));
    }

    this.shuffleArray(finalPosts);
    return finalPosts;
  }

  static async getPostsForClient(page: number, limit: number) {
    if (this.bufferPool.length === 0) {
      this.bufferPool = await this.getRandomPosts(35);
    }
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
    const cachedData = await CacheRepository.get('outstanding_posts');
    if (cachedData) {
      return JSON.parse(cachedData);
    }
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
    await CacheRepository.set('outstanding_posts', posts, 300);
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
    const tagIdArray = toArray(tagIds, String);
    if (tagIdArray.length > 0) {
      includeConditions.push({
        model: TagPost,
        where: { tagId: { [Op.in]: tagIdArray } },
        required: true,
      });
    }
    const propertyTypeNameArray = toArray(propertyTypeIds, String);
    const listingTypeEnumArray = toArray(listingTypeIds, String);
    if (listingTypeEnumArray.length > 0) {
      whereCondition.id = {
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
}

export default PostService;
