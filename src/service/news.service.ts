import { ActionType, Roles } from '@models/enums';
import { News, NewsHistory, User } from '@models';
import { NotFoundError, UnauthorizedError, CacheRepository, BadRequestError } from '@helper';
import { sequelize } from '@config/database';
import { Op, Transaction } from 'sequelize';

class NewsService {
  static async createNew(
    userId: string,
    title: string,
    content: string,
    image: string,
    origin: string,
    category: string,
    readingtime: number,
  ) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.create(
        {
          userId,
          title,
          content,
          imageUrl: image,
          origin_post: origin,
          category,
          readingTime: readingtime,
        },
        { transaction },
      );

      await this.saveNewsHistory(news.id.toString(), userId.toString(), ActionType.CREATE, transaction);
      return news;
    });
  }

  static async getAllNews(limit: number = 10, page?: number, lastCreatedAt?: string) {
    const MAX_TOTAL_LIMIT = 30;

    if (lastCreatedAt && isNaN(Date.parse(lastCreatedAt))) {
      throw new Error('Invalid lastCreatedAt format');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = page ? Math.max(page, 1) : 1;
    let whereCondition = {};
    let offset = 0;

    if (lastCreatedAt) {
      whereCondition = { createdAt: { [Op.lte]: new Date(lastCreatedAt) } };
    } else if (page) {
      offset = (safePage - 1) * safeLimit;
    }

    const newsList = await News.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset,
      include: [{ model: User, as: 'author', attributes: ['fullname', 'avatar'] }],
    });

    const lastNewsCreatedAt = newsList.length > 0 ? newsList[newsList.length - 1].createdAt : null;
    const total = await News.count();
    const totalPages = Math.ceil(total / safeLimit);

    const hasMore = lastCreatedAt
      ? (await News.count({ where: { createdAt: { [Op.lt]: lastNewsCreatedAt } } })) > 0
      : safePage < totalPages;

    let adjustedNewsList = newsList;

    if (lastCreatedAt) {
      const skippedCount = await News.count({
        where: { createdAt: { [Op.gt]: new Date(lastCreatedAt) } },
      });

      const totalLoaded = skippedCount + newsList.length;

      if (totalLoaded > MAX_TOTAL_LIMIT) {
        adjustedNewsList = newsList.slice(0, Math.max(0, MAX_TOTAL_LIMIT - skippedCount));
      }

      return {
        data: adjustedNewsList,
        meta: {
          hasNextPage: hasMore && totalLoaded < MAX_TOTAL_LIMIT,
          nextCreatedAt: lastNewsCreatedAt,
          total,
        },
      };
    } else {
      return {
        data: adjustedNewsList,
        meta: {
          hasNextPage: hasMore,
          nextCreatedAt: lastNewsCreatedAt,
          total,
          currentPage: safePage,
          totalPages,
        },
      };
    }
  }

  static async getNew(slug: string) {
    const cacheKey = `news:slug:${slug}`;
    const cachedNews = await CacheRepository.get(cacheKey);
    if (cachedNews) {
      return JSON.parse(cachedNews);
    }
    const findNews = await News.findOne({ where: { slug } });
    if (!findNews) {
      throw new NotFoundError('Không tìm thấy bài đăng!');
    }
    await CacheRepository.set(cacheKey, findNews, 300);
    return findNews;
  }

	static async getLatestNews() {

    const news = await News.findAll({
      where: {
        createdAt: {
          [Op.lte]: new Date()
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'fullname', 'email']
      }],
      attributes: [
        'id',
        'title',
        'slug',
        'imageUrl',
        'category',
        'readingTime',
        'view',
        'createdAt'
      ]
    });
    return news;
  }
  static async updateNews( newsId: string, userId: string, image: string | undefined, updatedData: any, removedImageUrl?: string ) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.findOne({ where: { id: newsId }, transaction });
      if (!news) {
        throw new NotFoundError('Tin tức không tồn tại hoặc bạn không có quyền cập nhật');
      }
      if (Object.keys(updatedData).length === 0 && !image && !removedImageUrl) {
        throw new BadRequestError('Không có dữ liệu nào để cập nhật');
      }
      await this.saveNewsHistory(newsId, userId, ActionType.UPDATE, transaction);
      const updatePayload: any = { ...updatedData };
      if (image) {
        updatePayload.imageUrl = image;
      } else if (removedImageUrl && removedImageUrl === news.imageUrl) {
        updatePayload.imageUrl = null;
      }
      await news.update(updatePayload, { transaction });
      return news;
    });
  }

  static async deleteNews(id: string, userId: string) {
    return await sequelize.transaction(async (transaction: Transaction) => {
      const news = await News.findByPk(id, { transaction });
      if (!news) {
        throw new NotFoundError('Tin tức không tồn tại');
      }
      await this.saveNewsHistory(id, userId, ActionType.DELETE, transaction);
      await news.destroy({ transaction });
      return { message: 'Tin tức đã bị xóa' };
    });
  }

  static async saveNewsHistory(newsId: string, userId: string, action: ActionType, transaction: Transaction) {
    const news = await News.findByPk(newsId, { transaction });
    if (!news) {
      throw new NotFoundError('Tin tức không tồn tại');
    }
    await NewsHistory.create(
      {
        newsId,
        userId,
        createdBy: Roles.User,
        title: news.title,
        content: news.content,
        originPost: news.origin_post,
        imageUrl: news.imageUrl,
        category: news.category,
        readingTime: news.readingTime,
        action,
        changedAt: new Date(),
        changeBy: userId,
      },
      { transaction },
    );
  }

  static async findNews(keyword: string, page: number, limit: number, offset: number) {
    const news = await News.findAndCountAll({
      where: {
        title: {
          [Op.like]: `%${keyword}%`,
        },
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'avatar', 'fullname'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
    return news;
  }
}

export default NewsService;
